import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ErrorCode,
  type User,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import type { ApiClient } from '../../api/createApiClient';
import type { TokenStorage } from '../../platform/tokenStorage';
import { createAuthApi } from './authApi';
import { toCreateUser } from './authSchema';

const username = UsernameSchema.parse('citizen');

const user: User = {
  id: UserIdSchema.parse('user-1'),
  username,
  email: 'citizen@cityborn.fr',
  type: 'email',
  isVerified: true,
};

function createFakeTokenStorage() {
  const state: { tokens: [string, string] | null; cleared: boolean } = {
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
  routes: Partial<ApiClient['auth']>,
): Pick<ApiClient, 'auth'> {
  return {
    auth: {
      me: unexpectedCall,
      refresh: unexpectedCall,
      signUp: unexpectedCall,
      signIn: unexpectedCall,
      signInWithGoogle: unexpectedCall,
      signInWithApple: unexpectedCall,
      resendVerificationEmail: unexpectedCall,
      verifyEmail: unexpectedCall,
      deleteUser: unexpectedCall,
      updateUsername: unexpectedCall,
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
  const authApi = createAuthApi(
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

  const result = await authApi.updatePassword({
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

test('signOut clears the stored tokens', async () => {
  const { state, tokenStorage } = createFakeTokenStorage();
  await tokenStorage.setTokens('access', 'refresh');
  const authApi = createAuthApi(createFakeClient({}), tokenStorage);

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
