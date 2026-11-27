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
  behavior: string;
  response: () => Promise<Response>;
  isExpectedError: (error: unknown) => boolean;
  endsTheSession: boolean;
};

type SessionEnding = {
  hasClearedTokens: boolean;
  hasSignedOut: boolean;
};

type StoredTokens = {
  access: string;
  refresh: string;
};

type FailingRefreshScenario = {
  contractClient: ContractClient;
  sessionEnding: SessionEnding;
};

const apiBaseUrl: string = 'https://api.cityborn.test';

const expiredTokenError: ApiError = {
  code: ErrorCode.TOKEN_EXPIRED,
  message: 'Expired',
  statusCode: 401,
};

const invalidTokenError: ApiError = {
  code: ErrorCode.USER_INVALID_TOKEN,
  message: 'Invalid token',
  statusCode: 401,
};

const backendUnavailableError: ApiError = {
  code: ErrorCode.UNKNOWN_ERROR,
  message: 'Backend unavailable',
  statusCode: 503,
};

function jsonResponse({
  body,
  status = 200,
}: {
  body: unknown;
  status?: number;
}): Response {
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

function createInMemoryTokenStorage(tokens: StoredTokens): TokenStorage {
  return {
    getAccessToken: async () => tokens.access || null,
    getRefreshToken: async () => tokens.refresh || null,
    setTokens: async (accessToken: string, refreshToken: string) => {
      tokens.access = accessToken;
      tokens.refresh = refreshToken;
    },
    clearTokens: async () => {
      tokens.access = '';
      tokens.refresh = '';
    },
  };
}

function isApiResponseErrorWithStatus(
  statusCode: number,
): (error: unknown) => boolean {
  return (error: unknown): boolean =>
    error instanceof ApiResponseError && error.statusCode === statusCode;
}

const refreshFailureCases: RefreshFailureCase[] = [
  {
    behavior:
      'propagates a network failure of the refresh and keeps the session',
    response: async () => {
      throw new TypeError('Failed to fetch');
    },
    isExpectedError: (error: unknown): boolean => error instanceof TypeError,
    endsTheSession: false,
  },
  {
    behavior:
      'propagates a server failure of the refresh and keeps the session',
    response: async () =>
      jsonResponse({ body: backendUnavailableError, status: 503 }),
    isExpectedError: isApiResponseErrorWithStatus(503),
    endsTheSession: false,
  },
  {
    behavior: 'rejects and ends the session when the refresh token is refused',
    response: async () =>
      jsonResponse({
        body: {
          code: ErrorCode.USER_INVALID_TOKEN,
          message: 'Invalid refresh token',
          statusCode: 401,
        },
        status: 401,
      }),
    isExpectedError: isApiResponseErrorWithStatus(401),
    endsTheSession: true,
  },
];

function createClientWithFailingRefresh({
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
        return jsonResponse({ body: expiredTokenError, status: 401 });
      }
      if (url.pathname === contract.auth.signOut.path) {
        sessionEnding.hasSignedOut = true;
        return jsonResponse({ body: {} });
      }
      return refreshResponse();
    },
  });
  const contractClient: ContractClient = createContractClient(tokenStorage);

  return { contractClient, sessionEnding };
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
        if (calls.length === 1) {
          return jsonResponse({ body: expiredTokenError, status: 401 });
        }
        return jsonResponse({ body: user });
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
    let resolveRefreshStarted: () => void = () => undefined;
    const refreshStarted: Promise<void> = new Promise<void>((resolve) => {
      resolveRefreshStarted = resolve;
    });
    let resolveRefreshResponse: (response: Response) => void = () => undefined;
    const refreshResponse: Promise<Response> = new Promise<Response>(
      (resolve) => {
        resolveRefreshResponse = resolve;
      },
    );
    let refreshCount: number = 0;
    stubFetch({
      context,
      respond: async (input: RequestInfo | URL): Promise<Response> => {
        const url: URL = new URL(String(input));
        if (url.pathname === contract.auth.me.path) {
          return jsonResponse({ body: expiredTokenError, status: 401 });
        }
        if (url.pathname === contract.auth.cookie.refresh.path) {
          refreshCount += 1;
          resolveRefreshStarted();
          return refreshResponse;
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
    await refreshStarted;
    const secondRequest: Promise<void> = assert.rejects(
      contractClient.auth.me(),
      isServerFailure,
    );
    await setImmediate();
    resolveRefreshResponse(
      jsonResponse({ body: backendUnavailableError, status: 503 }),
    );
    await Promise.all([firstRequest, secondRequest]);

    assert.equal(refreshCount, 1);
  });

  it('returns an invalid token error without refreshing when no stored access token was sent', async (context: TestContext) => {
    const calls: string[] = [];
    stubFetch({
      context,
      respond: async (input: RequestInfo | URL): Promise<Response> => {
        calls.push(new URL(String(input)).pathname);
        return jsonResponse({ body: invalidTokenError, status: 401 });
      },
    });
    const contractClient: ContractClient =
      createCookieContractClient(apiBaseUrl);

    const result: ClientInferResponses<AppContract['auth']['resetPassword']> =
      await contractClient.auth.resetPassword({
        body: {
          token: 'expired-reset-token',
          password: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        },
      });

    assert.equal(result.status, 401);
    assert.deepEqual(calls, [contract.auth.resetPassword.path]);
  });

  refreshFailureCases.forEach(
    ({
      behavior,
      response,
      isExpectedError,
      endsTheSession,
    }: RefreshFailureCase) => {
      it(behavior, async (context: TestContext) => {
        const { contractClient, sessionEnding }: FailingRefreshScenario =
          createClientWithFailingRefresh({
            context,
            createContractClient: () => createCookieContractClient(apiBaseUrl),
            refreshResponse: response,
          });

        const currentUserRequest: Promise<
          ClientInferResponses<AppContract['auth']['me']>
        > = contractClient.auth.me();

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
    const tokens: StoredTokens = {
      access: 'expired-access',
      refresh: 'mobile-refresh',
    };
    const tokenStorage: TokenStorage = createInMemoryTokenStorage(tokens);
    stubFetch({
      context,
      respond: async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        calls.push({ url: String(input), init });
        if (calls.length === 1) {
          return jsonResponse({ body: expiredTokenError, status: 401 });
        }
        if (calls.length === 2) {
          return jsonResponse({
            body: {
              access_token: 'new-access',
              refresh_token: 'new-refresh',
              user,
            },
          });
        }
        return jsonResponse({ body: user });
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
        return jsonResponse({ body: {} });
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
      behavior,
      response,
      isExpectedError,
      endsTheSession,
    }: RefreshFailureCase) => {
      it(behavior, async (context: TestContext) => {
        const { contractClient, sessionEnding }: FailingRefreshScenario =
          createClientWithFailingRefresh({
            context,
            createContractClient: (tokenStorage: TokenStorage) =>
              createBearerContractClient(apiBaseUrl, tokenStorage),
            refreshResponse: response,
          });

        const currentUserRequest: Promise<
          ClientInferResponses<AppContract['auth']['me']>
        > = contractClient.auth.me();

        await assert.rejects(currentUserRequest, isExpectedError);
        assert.deepEqual(sessionEnding, {
          hasClearedTokens: endsTheSession,
          hasSignedOut: false,
        });
      });
    },
  );

  it('ends the session when an unrecognized access token cannot be refreshed', async (context: TestContext) => {
    const tokens: StoredTokens = {
      access: 'unrecognized-access',
      refresh: 'unrecognized-refresh',
    };
    const tokenStorage: TokenStorage = createInMemoryTokenStorage(tokens);
    stubFetch({
      context,
      respond: async (): Promise<Response> =>
        jsonResponse({ body: invalidTokenError, status: 401 }),
    });
    const contractClient: ContractClient = createBearerContractClient(
      apiBaseUrl,
      tokenStorage,
    );

    const currentUserRequest: Promise<
      ClientInferResponses<AppContract['auth']['me']>
    > = contractClient.auth.me();

    await assert.rejects(currentUserRequest, isApiResponseErrorWithStatus(401));
    assert.deepEqual(tokens, { access: '', refresh: '' });
  });

  it('keeps the session when a password reset token is refused', async (context: TestContext) => {
    const user: User = buildUser();
    const calls: string[] = [];
    const tokens: StoredTokens = {
      access: 'mobile-access',
      refresh: 'mobile-refresh',
    };
    const tokenStorage: TokenStorage = createInMemoryTokenStorage(tokens);
    stubFetch({
      context,
      respond: async (input: RequestInfo | URL): Promise<Response> => {
        const url: URL = new URL(String(input));
        calls.push(url.pathname);
        if (url.pathname === contract.auth.refresh.path) {
          return jsonResponse({
            body: {
              access_token: 'new-access',
              refresh_token: 'new-refresh',
              user,
            },
          });
        }
        return jsonResponse({ body: invalidTokenError, status: 401 });
      },
    });
    const contractClient: ContractClient = createBearerContractClient(
      apiBaseUrl,
      tokenStorage,
    );

    const result: ClientInferResponses<AppContract['auth']['resetPassword']> =
      await contractClient.auth.resetPassword({
        body: {
          token: 'expired-reset-token',
          password: 'NewPassword1!',
          confirmPassword: 'NewPassword1!',
        },
      });

    assert.equal(result.status, 401);
    assert.deepEqual(calls, [
      contract.auth.resetPassword.path,
      contract.auth.refresh.path,
      contract.auth.resetPassword.path,
    ]);
    assert.deepEqual(tokens, { access: 'new-access', refresh: 'new-refresh' });
  });
});
