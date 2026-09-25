import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildUser, ErrorCode, type User } from '@cityborn/api';
import type { TokenStorage } from '../platform/tokenStorage';
import { createApiClient, createCookieApiClient } from './createApiClient';

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

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
  const client = createCookieApiClient('https://api.cityborn.test', {
    client: { name: 'web' },
  });

  const result = await client.auth.me();

  assert.equal(result.status, 200);
  assert.deepEqual(
    calls.map(({ url }: FetchCall): string => url),
    [
      'https://api.cityborn.test/auth/me',
      'https://api.cityborn.test/auth/cookie/refresh',
      'https://api.cityborn.test/auth/me',
    ],
  );
  for (const call of calls) {
    assert.equal(new Headers(call.init?.headers).get('Authorization'), null);
    assert.equal(call.init?.credentials, 'include');
  }
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
  const client = createApiClient('https://api.cityborn.test', tokenStorage, {
    client: { name: 'mobile', version: '1.0.0' },
  });

  const result = await client.auth.me();

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
