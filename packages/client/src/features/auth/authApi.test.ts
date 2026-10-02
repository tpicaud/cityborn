import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ApiResponseError,
  type ApiResult,
  ErrorCode,
  type User,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';
import type { TokenStorage } from '../../platform/tokenStorage';
import { type AuthApi, createAuthApi, createCookieAuthApi } from './authApi';
import { toCreateUser } from './authSchema';

const username = UsernameSchema.parse('citizen');

type FakeTokenStorageState = {
  tokens: [string, string] | null;
  cleared: boolean;
};

type FakeTokenStorage = {
  state: FakeTokenStorageState;
  tokenStorage: TokenStorage;
};

const user: User = {
  id: UserIdSchema.parse('user-1'),
  username,
  email: 'citizen@cityborn.fr',
  type: 'email',
  isVerified: true,
};

function createFakeTokenStorage(): FakeTokenStorage {
  const state: FakeTokenStorageState = {
    tokens: null,
    cleared: false,
  };

  const tokenStorage: TokenStorage = {
    async getAccessToken() {
      return state.tokens?.[0] ?? null;
    },
    async getRefreshToken() {
      return state.tokens?.[1] ?? null;
    },
    async setTokens(access_token, refresh_token) {
      state.tokens = [access_token, refresh_token];
    },
    async clearTokens() {
      state.tokens = null;
      state.cleared = true;
    },
  };

  return { state, tokenStorage };
}

function unexpectedCall(): never {
  throw new Error('unexpected route call');
}

function createFakeClient(
  routes: Partial<Omit<ContractClient['auth'], 'cookie'>>,
  cookieRoutes: Partial<ContractClient['auth']['cookie']> = {},
): Pick<ContractClient, 'auth'> {
  return {
    auth: {
      me: unexpectedCall,
      refresh: unexpectedCall,
      signOut: unexpectedCall,
      cookie: {
        refresh: unexpectedCall,
        signUp: unexpectedCall,
        signIn: unexpectedCall,
        signInWithGoogle: unexpectedCall,
        signInWithApple: unexpectedCall,
        updatePassword: unexpectedCall,
        ...cookieRoutes,
      },
      signUp: unexpectedCall,
      signIn: unexpectedCall,
      signInWithGoogle: unexpectedCall,
      signInWithApple: unexpectedCall,
      resendVerificationEmail: unexpectedCall,
      verifyEmail: unexpectedCall,
      deleteUser: unexpectedCall,
      updatePassword: unexpectedCall,
      ...routes,
    },
  };
}

test('signIn stores the returned tokens and exposes the user', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  const authApi = createAuthApi(
    createFakeClient({
      signIn: async () => ({
        status: 200,
        body: { access_token: 'access', refresh_token: 'refresh', user },
        headers: new Headers(),
      }),
    }),
    tokenStorage,
  );

  const result = await authApi.signIn({
    identifier: 'citizen',
    password: 'Password1',
  });

  assert.deepEqual(result, { ok: true, data: user });
  assert.deepEqual(state.tokens, ['access', 'refresh']);
});

test('a rejected signIn stores no token', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  const authApi = createAuthApi(
    createFakeClient({
      signIn: async () => ({
        status: 401,
        body: {
          code: ErrorCode.USER_INVALID_CREDENTIALS,
          message: 'Identifiants invalides',
          statusCode: 401,
        },
        headers: new Headers(),
      }),
    }),
    tokenStorage,
  );

  const result = await authApi.signIn({
    identifier: 'citizen',
    password: 'wrong',
  });

  assert.equal(result.ok, false);
  assert.equal(state.tokens, null);
});

test('updatePassword stores the rotated tokens', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  const authApi: AuthApi = createAuthApi(
    createFakeClient({
      updatePassword: async () => ({
        status: 200,
        body: {
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          user,
        },
        headers: new Headers(),
      }),
    }),
    tokenStorage,
  );

  const result: ApiResult<User> = await authApi.updatePassword({
    currentPassword: 'Password1',
    newPassword: 'Password2',
  });

  assert.deepEqual(result, { ok: true, data: user });
  assert.deepEqual(state.tokens, ['new-access', 'new-refresh']);
});

test('getCurrentUser resolves to null without calling the API when no token is stored', async () => {
  const { tokenStorage } = createFakeTokenStorage();
  const authApi = createAuthApi(createFakeClient({}), tokenStorage);

  assert.equal(await authApi.getCurrentUser(), null);
});

type AuthApiFactory = {
  name: string;
  create: (contractClient: Pick<ContractClient, 'auth'>) => AuthApi;
};

const authApiFactories: AuthApiFactory[] = [
  { name: 'cookie', create: createCookieAuthApi },
  {
    name: 'bearer',
    create: (contractClient) => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      state.tokens = ['access', 'refresh'];
      return createAuthApi(contractClient, tokenStorage);
    },
  },
];

authApiFactories.forEach(({ name, create }: AuthApiFactory) => {
  test(`${name} getCurrentUser returns the authenticated user`, async () => {
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => ({ status: 200, body: user, headers: new Headers() }),
      }),
    );

    assert.deepEqual(await authApi.getCurrentUser(), user);
  });

  test(`${name} getCurrentUser returns null for a refused session`, async () => {
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => ({
          status: 401,
          body: {
            code: ErrorCode.USER_TOKEN_MISSING,
            message: 'No token',
            statusCode: 401,
          },
          headers: new Headers(),
        }),
      }),
    );

    assert.equal(await authApi.getCurrentUser(), null);
  });

  test(`${name} getCurrentUser returns null when refreshing refuses the session`, async () => {
    const refreshError: ApiResponseError = new ApiResponseError({
      code: ErrorCode.USER_REFRESH_FAILED,
      message: 'Invalid refresh token',
      statusCode: 401,
    });
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => {
          throw refreshError;
        },
      }),
    );

    assert.equal(await authApi.getCurrentUser(), null);
  });

  test(`${name} getCurrentUser propagates network failures`, async () => {
    const networkError: TypeError = new TypeError('Failed to fetch');
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => {
          throw networkError;
        },
      }),
    );

    await assert.rejects(
      authApi.getCurrentUser(),
      (error: unknown): boolean => error === networkError,
    );
  });

  test(`${name} getCurrentUser propagates server errors`, async () => {
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => ({
          status: 500,
          body: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Backend unavailable',
            statusCode: 500,
          },
          headers: new Headers(),
        }),
      }),
    );

    await assert.rejects(
      authApi.getCurrentUser(),
      (error: unknown): boolean =>
        error instanceof ApiResponseError && error.statusCode === 500,
    );
  });

  test(`${name} getCurrentUser propagates technical refresh errors`, async () => {
    const refreshError: ApiResponseError = new ApiResponseError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Refresh backend unavailable',
      statusCode: 503,
    });
    const authApi: AuthApi = create(
      createFakeClient({
        me: async () => {
          throw refreshError;
        },
      }),
    );

    await assert.rejects(
      authApi.getCurrentUser(),
      (error: unknown): boolean => error === refreshError,
    );
  });
});

test('bearer signOut revokes the stored refresh token before clearing it', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  await tokenStorage.setTokens('access', 'refresh');
  const signOutCalls: Parameters<ContractClient['auth']['signOut']>[0][] = [];
  const authApi: AuthApi = createAuthApi(
    createFakeClient({
      signOut: async (args) => {
        signOutCalls.push(args);
        assert.equal(state.cleared, false);
        return { status: 200, body: {}, headers: new Headers() };
      },
    }),
    tokenStorage,
  );

  await authApi.signOut();

  assert.deepEqual(signOutCalls, [
    { body: {}, extraHeaders: { authorization: 'Bearer refresh' } },
  ]);
  assert.equal(state.tokens, null);
  assert.equal(state.cleared, true);
});

test('bearer signOut clears the stored tokens when the server is unreachable', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  await tokenStorage.setTokens('access', 'refresh');
  const authApi: AuthApi = createAuthApi(
    createFakeClient({
      signOut: async () => {
        throw new TypeError('Network request failed');
      },
    }),
    tokenStorage,
  );

  await authApi.signOut();

  assert.equal(state.tokens, null);
  assert.equal(state.cleared, true);
});

test('toCreateUser drops confirmPassword from the sign-up payload', () => {
  assert.deepEqual(
    toCreateUser({
      username,
      email: 'citizen@cityborn.fr',
      password: 'Password1',
      confirmPassword: 'Password1',
    }),
    {
      username: 'citizen',
      email: 'citizen@cityborn.fr',
      password: 'Password1',
    },
  );
});

test('cookie signIn uses the cookie route without token storage', async () => {
  let called: boolean = false;
  const authApi: AuthApi = createCookieAuthApi(
    createFakeClient(
      {},
      {
        signIn: async () => {
          called = true;
          return {
            status: 200,
            body: user,
            headers: new Headers(),
          };
        },
      },
    ),
  );

  const result: ApiResult<User> = await authApi.signIn({
    identifier: 'citizen',
    password: 'Password1',
  });

  assert.equal(called, true);
  assert.deepEqual(result, { ok: true, data: user });
});

test('cookie updatePassword uses the cookie route without exposing tokens', async () => {
  const authApi: AuthApi = createCookieAuthApi(
    createFakeClient(
      {},
      {
        updatePassword: async () => ({
          status: 200,
          body: user,
          headers: new Headers(),
        }),
      },
    ),
  );

  const result: ApiResult<User> = await authApi.updatePassword({
    currentPassword: 'Password1',
    newPassword: 'Password2',
  });

  assert.deepEqual(result, { ok: true, data: user });
});

test('cookie signOut clears the server session through the shared route', async () => {
  let called: boolean = false;
  const authApi: AuthApi = createCookieAuthApi(
    createFakeClient({
      signOut: async () => {
        called = true;
        return {
          status: 200,
          body: {},
          headers: new Headers(),
        };
      },
    }),
  );

  await authApi.signOut();

  assert.equal(called, true);
});
