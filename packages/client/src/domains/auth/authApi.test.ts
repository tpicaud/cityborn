import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ApiResponseError,
  buildUser,
  ErrorCode,
  type User,
} from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';
import type { TokenStorage } from '../../platform/tokenStorage';
import { type AuthApi, createAuthApi, createCookieAuthApi } from './authApi';

type FakeTokenStorageState = {
  tokens: [string, string] | null;
  cleared: boolean;
};

type FakeTokenStorage = {
  state: FakeTokenStorageState;
  tokenStorage: TokenStorage;
};

const user: User = buildUser();

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

function createFakeClient({
  routes = {},
  cookieRoutes = {},
}: {
  routes?: Partial<Omit<ContractClient['auth'], 'cookie'>>;
  cookieRoutes?: Partial<ContractClient['auth']['cookie']>;
}): Pick<ContractClient, 'auth'> {
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
      register: unexpectedCall,
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

function createAuthApiWithStoredTokens(
  contractClient: Pick<ContractClient, 'auth'>,
): AuthApi {
  const { state, tokenStorage }: FakeTokenStorage = createFakeTokenStorage();
  state.tokens = ['access', 'refresh'];
  return createAuthApi(contractClient, tokenStorage);
}

function itReadsTheCurrentUserSession(
  createSignedInAuthApi: (
    contractClient: Pick<ContractClient, 'auth'>,
  ) => AuthApi,
): void {
  it('returns the authenticated user', async () => {
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => ({ status: 200, body: user, headers: new Headers() }),
        },
      }),
    );

    const currentUser: User | null = await authApi.getCurrentUser();

    assert.deepEqual(currentUser, user);
  });

  it('returns null for a refused session', async () => {
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => ({
            status: 401,
            body: {
              code: ErrorCode.USER_TOKEN_MISSING,
              message: 'No token',
              statusCode: 401,
            },
            headers: new Headers(),
          }),
        },
      }),
    );

    const currentUser: User | null = await authApi.getCurrentUser();

    assert.equal(currentUser, null);
  });

  it('returns null when refreshing refuses the session', async () => {
    const refreshError: ApiResponseError = new ApiResponseError({
      code: ErrorCode.USER_REFRESH_FAILED,
      message: 'Invalid refresh token',
      statusCode: 401,
    });
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => {
            throw refreshError;
          },
        },
      }),
    );

    const currentUser: User | null = await authApi.getCurrentUser();

    assert.equal(currentUser, null);
  });

  it('propagates network failures', async () => {
    const networkError: TypeError = new TypeError('Failed to fetch');
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => {
            throw networkError;
          },
        },
      }),
    );

    const currentUserRequest: Promise<User | null> = authApi.getCurrentUser();

    await assert.rejects(
      currentUserRequest,
      (error: unknown): boolean => error === networkError,
    );
  });

  it('propagates server errors', async () => {
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => ({
            status: 500,
            body: {
              code: ErrorCode.UNKNOWN_ERROR,
              message: 'Backend unavailable',
              statusCode: 500,
            },
            headers: new Headers(),
          }),
        },
      }),
    );

    const currentUserRequest: Promise<User | null> = authApi.getCurrentUser();

    await assert.rejects(
      currentUserRequest,
      (error: unknown): boolean =>
        error instanceof ApiResponseError && error.statusCode === 500,
    );
  });

  it('propagates technical refresh errors', async () => {
    const refreshError: ApiResponseError = new ApiResponseError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Refresh backend unavailable',
      statusCode: 503,
    });
    const authApi: AuthApi = createSignedInAuthApi(
      createFakeClient({
        routes: {
          me: async () => {
            throw refreshError;
          },
        },
      }),
    );

    const currentUserRequest: Promise<User | null> = authApi.getCurrentUser();

    await assert.rejects(
      currentUserRequest,
      (error: unknown): boolean => error === refreshError,
    );
  });
}

describe('createAuthApi', () => {
  describe('signIn', () => {
    it('stores the returned tokens and exposes the user', async () => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      const authApi: AuthApi = createAuthApi(
        createFakeClient({
          routes: {
            signIn: async () => ({
              status: 200,
              body: { access_token: 'access', refresh_token: 'refresh', user },
              headers: new Headers(),
            }),
          },
        }),
        tokenStorage,
      );

      const signedInUser: User = await authApi.signIn({
        identifier: 'citizen',
        password: 'Password1',
      });

      assert.deepEqual(signedInUser, user);
      assert.deepEqual(state.tokens, ['access', 'refresh']);
    });

    it('stores no token when the sign-in is rejected', async () => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      const authApi: AuthApi = createAuthApi(
        createFakeClient({
          routes: {
            signIn: async () => ({
              status: 401,
              body: {
                code: ErrorCode.USER_INVALID_CREDENTIALS,
                message: 'Identifiants invalides',
                statusCode: 401,
              },
              headers: new Headers(),
            }),
          },
        }),
        tokenStorage,
      );

      const signInRequest: Promise<User> = authApi.signIn({
        identifier: 'citizen',
        password: 'wrong',
      });

      await assert.rejects(
        signInRequest,
        (error: unknown): boolean =>
          error instanceof ApiResponseError &&
          error.code === ErrorCode.USER_INVALID_CREDENTIALS,
      );
      assert.equal(state.tokens, null);
    });
  });

  describe('updatePassword', () => {
    it('stores the rotated tokens', async () => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      const authApi: AuthApi = createAuthApi(
        createFakeClient({
          routes: {
            updatePassword: async () => ({
              status: 200,
              body: {
                access_token: 'new-access',
                refresh_token: 'new-refresh',
                user,
              },
              headers: new Headers(),
            }),
          },
        }),
        tokenStorage,
      );

      const updatedUser: User = await authApi.updatePassword({
        currentPassword: 'Password1',
        newPassword: 'Password2',
      });

      assert.deepEqual(updatedUser, user);
      assert.deepEqual(state.tokens, ['new-access', 'new-refresh']);
    });
  });

  describe('getCurrentUser', () => {
    it('resolves to null without calling the API when no token is stored', async () => {
      const { tokenStorage }: FakeTokenStorage = createFakeTokenStorage();
      const authApi: AuthApi = createAuthApi(
        createFakeClient({}),
        tokenStorage,
      );

      const currentUser: User | null = await authApi.getCurrentUser();

      assert.equal(currentUser, null);
    });

    itReadsTheCurrentUserSession(createAuthApiWithStoredTokens);
  });

  describe('signOut', () => {
    it('revokes the stored refresh token before clearing it', async () => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      await tokenStorage.setTokens('access', 'refresh');
      const signOutCalls: Parameters<ContractClient['auth']['signOut']>[0][] =
        [];
      const tokensClearedBeforeRevocation: boolean[] = [];
      const authApi: AuthApi = createAuthApi(
        createFakeClient({
          routes: {
            signOut: async (args) => {
              signOutCalls.push(args);
              tokensClearedBeforeRevocation.push(state.cleared);
              return { status: 200, body: {}, headers: new Headers() };
            },
          },
        }),
        tokenStorage,
      );

      await authApi.signOut();

      assert.deepEqual(signOutCalls, [
        { body: {}, extraHeaders: { authorization: 'Bearer refresh' } },
      ]);
      assert.deepEqual(tokensClearedBeforeRevocation, [false]);
      assert.equal(state.tokens, null);
      assert.equal(state.cleared, true);
    });

    it('clears the stored tokens when the server is unreachable', async () => {
      const { state, tokenStorage }: FakeTokenStorage =
        createFakeTokenStorage();
      await tokenStorage.setTokens('access', 'refresh');
      const authApi: AuthApi = createAuthApi(
        createFakeClient({
          routes: {
            signOut: async () => {
              throw new TypeError('Network request failed');
            },
          },
        }),
        tokenStorage,
      );

      await authApi.signOut();

      assert.equal(state.tokens, null);
      assert.equal(state.cleared, true);
    });
  });
});

describe('createCookieAuthApi', () => {
  describe('signIn', () => {
    it('uses the cookie route without token storage', async () => {
      let called: boolean = false;
      const authApi: AuthApi = createCookieAuthApi(
        createFakeClient({
          cookieRoutes: {
            signIn: async () => {
              called = true;
              return { status: 200, body: user, headers: new Headers() };
            },
          },
        }),
      );

      const signedInUser: User = await authApi.signIn({
        identifier: 'citizen',
        password: 'Password1',
      });

      assert.equal(called, true);
      assert.deepEqual(signedInUser, user);
    });
  });

  describe('updatePassword', () => {
    it('uses the cookie route without exposing tokens', async () => {
      const authApi: AuthApi = createCookieAuthApi(
        createFakeClient({
          cookieRoutes: {
            updatePassword: async () => ({
              status: 200,
              body: user,
              headers: new Headers(),
            }),
          },
        }),
      );

      const updatedUser: User = await authApi.updatePassword({
        currentPassword: 'Password1',
        newPassword: 'Password2',
      });

      assert.deepEqual(updatedUser, user);
    });
  });

  describe('getCurrentUser', () => {
    itReadsTheCurrentUserSession(createCookieAuthApi);
  });

  describe('signOut', () => {
    it('clears the server session through the shared route', async () => {
      let called: boolean = false;
      const authApi: AuthApi = createCookieAuthApi(
        createFakeClient({
          routes: {
            signOut: async () => {
              called = true;
              return { status: 200, body: {}, headers: new Headers() };
            },
          },
        }),
      );

      await authApi.signOut();

      assert.equal(called, true);
    });
  });
});
