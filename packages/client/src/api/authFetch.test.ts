import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import {
  type ApiError,
  ApiResponseError,
  type AppContract,
  buildUser,
  contract,
  ErrorCode,
  type User,
} from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { TokenStorage } from '../platform/tokenStorage';
import {
  type ContractClient,
  createBearerContractClient,
  createCookieContractClient,
} from './contractClient';

type FetchCall = {
  url: string;
  init: RequestInit | undefined;
};

type RefreshFailureCase = {
  name: string;
  response: () => Promise<Response>;
  isExpectedError: (error: unknown) => boolean;
  endsTheSession: boolean;
};

type SessionEnding = {
  hasClearedTokens: boolean;
  hasSignedOut: boolean;
};

type FailingRefreshScenario = {
  currentUserRequest: Promise<unknown>;
  sessionEnding: SessionEnding;
};

const apiBaseUrl: string = 'https://api.cityborn.test';

const expiredTokenError: ApiError = {
  code: ErrorCode.TOKEN_EXPIRED,
  message: 'Expired',
  statusCode: 401,
};

const backendUnavailableError: ApiError = {
  code: ErrorCode.UNKNOWN_ERROR,
  message: 'Backend unavailable',
  statusCode: 503,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch({
  context,
  respond,
}: {
  context: TestContext;
  respond: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}): void {
  const originalFetch: typeof fetch = globalThis.fetch;
  globalThis.fetch = respond;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
}

function isApiResponseErrorWithStatus(
  statusCode: number,
): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof ApiResponseError && error.statusCode === statusCode;
}

const refreshFailureCases: RefreshFailureCase[] = [
  {
    name: 'network failure',
    response: async () => {
      throw new TypeError('Failed to fetch');
    },
    isExpectedError: (error: unknown): boolean => error instanceof TypeError,
    endsTheSession: false,
  },
  {
    name: 'server failure',
    response: async () => jsonResponse(backendUnavailableError, 503),
    isExpectedError: isApiResponseErrorWithStatus(503),
    endsTheSession: false,
  },
  {
    name: 'refused refresh token',
    response: async () =>
      jsonResponse(
        {
          code: ErrorCode.USER_INVALID_TOKEN,
          message: 'Invalid refresh token',
          statusCode: 401,
        },
        401,
      ),
    isExpectedError: isApiResponseErrorWithStatus(401),
    endsTheSession: true,
  },
];

function requestCurrentUserWithFailingRefresh({
  context,
  createContractClient,
  refreshResponse,
}: {
  context: TestContext;
  createContractClient: (tokenStorage: TokenStorage) => ContractClient;
  refreshResponse: () => Promise<Response>;
}): FailingRefreshScenario {
  const sessionEnding: SessionEnding = {
    hasClearedTokens: false,
    hasSignedOut: false,
  };
  const tokenStorage: TokenStorage = {
    getAccessToken: async () => 'expired-access',
    getRefreshToken: async () => 'refresh-token',
    setTokens: async () => {},
    clearTokens: async () => {
      sessionEnding.hasClearedTokens = true;
    },
  };
  stubFetch({
    context,
    respond: async (input: RequestInfo | URL): Promise<Response> => {
      const url: URL = new URL(String(input));
      if (url.pathname === contract.auth.me.path) {
        return jsonResponse(expiredTokenError, 401);
      }
      if (url.pathname === contract.auth.signOut.path) {
        sessionEnding.hasSignedOut = true;
        return jsonResponse({});
      }
      return refreshResponse();
    },
  });
  const contractClient: ContractClient = createContractClient(tokenStorage);

  return { currentUserRequest: contractClient.auth.me(), sessionEnding };
}

describe('createCookieContractClient', () => {
  it('refreshes through the cookie route without exposing an authorization header', async (context: TestContext) => {
    const user: User = buildUser();
    const calls: FetchCall[] = [];
    stubFetch({
      context,
      respond: async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        calls.push({ url: String(input), init });
        if (calls.length === 1) return jsonResponse(expiredTokenError, 401);
        return jsonResponse(user);
      },
    });
    const contractClient: ContractClient = createCookieContractClient(
      apiBaseUrl,
      { client: { name: 'web' } },
    );

    const result: ClientInferResponses<AppContract['auth']['me']> =
      await contractClient.auth.me();

    assert.equal(result.status, 200);
    assert.deepEqual(
      calls.map(({ url }: FetchCall): string => url),
      [
        'https://api.cityborn.test/auth/me',
        'https://api.cityborn.test/auth/cookie/refresh',
        'https://api.cityborn.test/auth/me',
      ],
    );
    assert.deepEqual(
      calls.map(({ init }: FetchCall): string | null =>
        new Headers(init?.headers).get('Authorization'),
      ),
      [null, null, null],
    );
    assert.deepEqual(
      calls.map(
        ({ init }: FetchCall): RequestCredentials | undefined =>
          init?.credentials,
      ),
      ['include', 'include', 'include'],
    );
  });

  it('shares the refresh failure between concurrent requests without replacing it with an authentication error', async (context: TestContext) => {
    const refreshStarted: PromiseWithResolvers<void> =
      Promise.withResolvers<void>();
    const refreshResponse: PromiseWithResolvers<Response> =
      Promise.withResolvers<Response>();
    let refreshCount: number = 0;
    stubFetch({
      context,
      respond: async (input: RequestInfo | URL): Promise<Response> => {
        const url: URL = new URL(String(input));
        if (url.pathname === contract.auth.me.path) {
          return jsonResponse(expiredTokenError, 401);
        }
        if (url.pathname === contract.auth.cookie.refresh.path) {
          refreshCount += 1;
          refreshStarted.resolve();
          return refreshResponse.promise;
        }
        throw new Error(`Unexpected request: ${url.pathname}`);
      },
    });
    const contractClient: ContractClient =
      createCookieContractClient(apiBaseUrl);
    const isServerFailure: (error: unknown) => boolean =
      isApiResponseErrorWithStatus(503);

    const firstRequest: Promise<void> = assert.rejects(
      contractClient.auth.me(),
      isServerFailure,
    );
    await refreshStarted.promise;
    const secondRequest: Promise<void> = assert.rejects(
      contractClient.auth.me(),
      isServerFailure,
    );
    await setImmediate();
    refreshResponse.resolve(jsonResponse(backendUnavailableError, 503));
    await Promise.all([firstRequest, secondRequest]);

    assert.equal(refreshCount, 1);
  });

  refreshFailureCases.forEach(
    ({
      name,
      response,
      isExpectedError,
      endsTheSession,
    }: RefreshFailureCase) => {
      it(`handles a ${name} on refresh without treating a technical error as a logout`, async (context: TestContext) => {
        const { currentUserRequest, sessionEnding }: FailingRefreshScenario =
          requestCurrentUserWithFailingRefresh({
            context,
            createContractClient: () => createCookieContractClient(apiBaseUrl),
            refreshResponse: response,
          });

        await assert.rejects(currentUserRequest, isExpectedError);

        assert.deepEqual(sessionEnding, {
          hasClearedTokens: false,
          hasSignedOut: endsTheSession,
        });
      });
    },
  );
});

describe('createBearerContractClient', () => {
  it('refreshes mobile tokens through the legacy route', async (context: TestContext) => {
    const user: User = buildUser();
    const calls: FetchCall[] = [];
    const tokens: { access: string; refresh: string } = {
      access: 'expired-access',
      refresh: 'mobile-refresh',
    };
    const tokenStorage: TokenStorage = {
      async getAccessToken(): Promise<string> {
        return tokens.access;
      },
      async getRefreshToken(): Promise<string> {
        return tokens.refresh;
      },
      async setTokens(accessToken, refreshToken): Promise<void> {
        tokens.access = accessToken;
        tokens.refresh = refreshToken;
      },
      async clearTokens(): Promise<void> {
        tokens.access = '';
        tokens.refresh = '';
      },
    };
    stubFetch({
      context,
      respond: async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        calls.push({ url: String(input), init });
        if (calls.length === 1) return jsonResponse(expiredTokenError, 401);
        if (calls.length === 2) {
          return jsonResponse({
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            user,
          });
        }
        return jsonResponse(user);
      },
    });
    const contractClient: ContractClient = createBearerContractClient(
      apiBaseUrl,
      tokenStorage,
      { client: { name: 'mobile', version: '1.0.0' } },
    );

    const result: ClientInferResponses<AppContract['auth']['me']> =
      await contractClient.auth.me();

    assert.equal(result.status, 200);
    assert.deepEqual(
      calls.map(({ url }: FetchCall): string => url),
      [
        'https://api.cityborn.test/auth/me',
        'https://api.cityborn.test/auth/refresh',
        'https://api.cityborn.test/auth/me',
      ],
    );
    assert.deepEqual(
      calls.map(({ init }: FetchCall): string | null =>
        new Headers(init?.headers).get('Authorization'),
      ),
      ['Bearer expired-access', 'Bearer mobile-refresh', 'Bearer new-access'],
    );
    assert.deepEqual(tokens, {
      access: 'new-access',
      refresh: 'new-refresh',
    });
  });

  it('keeps an explicit authorization header instead of the stored access token', async (context: TestContext) => {
    const calls: FetchCall[] = [];
    const tokenStorage: TokenStorage = {
      async getAccessToken(): Promise<string> {
        return 'mobile-access';
      },
      async getRefreshToken(): Promise<string> {
        return 'mobile-refresh';
      },
      async setTokens(): Promise<void> {},
      async clearTokens(): Promise<void> {},
    };
    stubFetch({
      context,
      respond: async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        calls.push({ url: String(input), init });
        return jsonResponse({});
      },
    });
    const contractClient: ContractClient = createBearerContractClient(
      apiBaseUrl,
      tokenStorage,
    );

    await contractClient.auth.signOut({
      body: {},
      extraHeaders: { authorization: 'Bearer mobile-refresh' },
    });

    assert.deepEqual(
      calls.map(({ init }: FetchCall): string | null =>
        new Headers(init?.headers).get('Authorization'),
      ),
      ['Bearer mobile-refresh'],
    );
  });

  refreshFailureCases.forEach(
    ({
      name,
      response,
      isExpectedError,
      endsTheSession,
    }: RefreshFailureCase) => {
      it(`handles a ${name} on refresh without treating a technical error as a logout`, async (context: TestContext) => {
        const { currentUserRequest, sessionEnding }: FailingRefreshScenario =
          requestCurrentUserWithFailingRefresh({
            context,
            createContractClient: (tokenStorage: TokenStorage) =>
              createBearerContractClient(apiBaseUrl, tokenStorage),
            refreshResponse: response,
          });

        await assert.rejects(currentUserRequest, isExpectedError);

        assert.deepEqual(sessionEnding, {
          hasClearedTokens: endsTheSession,
          hasSignedOut: false,
        });
      });
    },
  );
});
