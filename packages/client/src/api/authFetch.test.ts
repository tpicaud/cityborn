import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import {
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('cookie transport refreshes through the cookie route without exposing an authorization header', async (context) => {
  const user: User = buildUser();
  const calls: FetchCall[] = [];
  const originalFetch: typeof fetch = globalThis.fetch;
  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) {
      return jsonResponse(
        {
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Expired',
          statusCode: 401,
        },
        401,
      );
    }
    if (calls.length === 2) {
      return jsonResponse(user);
    }
    return jsonResponse(user);
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const contractClient: ContractClient = createCookieContractClient(
    'https://api.cityborn.test',
    {
      client: { name: 'web' },
    },
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
  calls.forEach((call: FetchCall) => {
    assert.equal(new Headers(call.init?.headers).get('Authorization'), null);
    assert.equal(call.init?.credentials, 'include');
  });
});

test('bearer transport keeps refreshing mobile tokens through the legacy route', async (context) => {
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
  const originalFetch: typeof fetch = globalThis.fetch;
  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) {
      return jsonResponse(
        {
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'Expired',
          statusCode: 401,
        },
        401,
      );
    }
    if (calls.length === 2) {
      return jsonResponse({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        user,
      });
    }
    return jsonResponse(user);
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const contractClient: ContractClient = createBearerContractClient(
    'https://api.cityborn.test',
    tokenStorage,
    {
      client: { name: 'mobile', version: '1.0.0' },
    },
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

test('bearer transport keeps an explicit authorization header instead of the stored access token', async (context) => {
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
  const originalFetch: typeof fetch = globalThis.fetch;
  globalThis.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    calls.push({ url: String(input), init });
    return jsonResponse({});
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const contractClient: ContractClient = createBearerContractClient(
    'https://api.cityborn.test',
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

type RefreshFailureCase = {
  name: string;
  response: () => Promise<Response>;
  expectedStatus: number | null;
};

test('concurrent requests share the refresh failure without replacing it with an authentication error', async (context) => {
  const refreshStarted = Promise.withResolvers<void>();
  const refreshResponse = Promise.withResolvers<Response>();
  let refreshCount: number = 0;
  const originalFetch: typeof fetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url: URL = new URL(String(input));
    if (url.pathname === contract.auth.me.path) {
      return jsonResponse(
        { code: ErrorCode.TOKEN_EXPIRED, message: 'Expired', statusCode: 401 },
        401,
      );
    }
    if (url.pathname === contract.auth.cookie.refresh.path) {
      refreshCount += 1;
      refreshStarted.resolve();
      return refreshResponse.promise;
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  const contractClient: ContractClient = createCookieContractClient(
    'https://api.cityborn.test',
  );
  const isServerFailure = (error: unknown): boolean =>
    error instanceof ApiResponseError && error.statusCode === 503;
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
  refreshResponse.resolve(
    jsonResponse(
      {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Backend unavailable',
        statusCode: 503,
      },
      503,
    ),
  );

  await Promise.all([firstRequest, secondRequest]);

  assert.equal(refreshCount, 1);
});

const refreshFailureCases: RefreshFailureCase[] = [
  {
    name: 'network failure',
    response: async () => {
      throw new TypeError('Failed to fetch');
    },
    expectedStatus: null,
  },
  {
    name: 'server failure',
    response: async () =>
      jsonResponse(
        {
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Backend unavailable',
          statusCode: 503,
        },
        503,
      ),
    expectedStatus: 503,
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
    expectedStatus: 401,
  },
];

const authenticationTransports: ('cookie' | 'bearer')[] = ['cookie', 'bearer'];

authenticationTransports.forEach((authenticationTransport) => {
  refreshFailureCases.forEach(
    ({ name, response, expectedStatus }: RefreshFailureCase) => {
      test(`${authenticationTransport} refresh handles ${name} without treating technical errors as a logout`, async (context) => {
        let hasClearedTokens: boolean = false;
        let hasSignedOut: boolean = false;
        const tokenStorage: TokenStorage = {
          getAccessToken: async () => 'expired-access',
          getRefreshToken: async () => 'refresh-token',
          setTokens: async () => {},
          clearTokens: async () => {
            hasClearedTokens = true;
          },
        };
        const originalFetch: typeof fetch = globalThis.fetch;
        globalThis.fetch = async (
          input: RequestInfo | URL,
        ): Promise<Response> => {
          const url: URL = new URL(String(input));
          if (url.pathname === contract.auth.me.path) {
            return jsonResponse(
              {
                code: ErrorCode.TOKEN_EXPIRED,
                message: 'Expired',
                statusCode: 401,
              },
              401,
            );
          }
          if (url.pathname === contract.auth.signOut.path) {
            hasSignedOut = true;
            return jsonResponse({});
          }
          return response();
        };
        context.after(() => {
          globalThis.fetch = originalFetch;
        });
        const contractClient: ContractClient =
          authenticationTransport === 'cookie'
            ? createCookieContractClient('https://api.cityborn.test')
            : createBearerContractClient(
                'https://api.cityborn.test',
                tokenStorage,
              );

        await assert.rejects(
          contractClient.auth.me(),
          (error: unknown): boolean => {
            if (expectedStatus === null) return error instanceof TypeError;
            return (
              error instanceof ApiResponseError &&
              error.statusCode === expectedStatus
            );
          },
        );

        assert.equal(
          hasClearedTokens,
          authenticationTransport === 'bearer' && expectedStatus === 401,
        );
        assert.equal(
          hasSignedOut,
          authenticationTransport === 'cookie' && expectedStatus === 401,
        );
      });
    },
  );
});
