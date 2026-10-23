import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { buildUser, type GameRecord, type User } from '@cityborn/api';
import { type Query, QueryClient, type QueryKey } from '@tanstack/react-query';
import type { AuthApi } from './authApi';
import {
  accountQueryKey,
  clearCacheAfterSignOut,
  currentUserQueryOptions,
} from './authQueries';

const signedInUser: User = buildUser();

const signedInUserGameRecordsQueryKey: QueryKey = [
  ...accountQueryKey(signedInUser.id),
  'gameRecords',
];

const categoryTreesQueryKey: QueryKey = ['category', 'trees'];

const adminCategoryListQueryKey: QueryKey = ['admin', 'categories', 'list'];

function unexpectedCall(): never {
  throw new Error('unexpected auth call');
}

function createFakeAuthApi(getCurrentUser: AuthApi['getCurrentUser']): AuthApi {
  return {
    getCurrentUser,
    signIn: unexpectedCall,
    register: unexpectedCall,
    requestPasswordReset: unexpectedCall,
    resetPassword: unexpectedCall,
    updateEmail: unexpectedCall,
    signInWithGoogle: unexpectedCall,
    signInWithApple: unexpectedCall,
    signOut: unexpectedCall,
    deleteUser: unexpectedCall,
    updatePassword: unexpectedCall,
    resendVerificationEmail: unexpectedCall,
    verifyEmail: unexpectedCall,
  };
}

describe('clearCacheAfterSignOut', () => {
  it('signs the user out and drops every other cached query', async (context: TestContext) => {
    const authApi: AuthApi = createFakeAuthApi(async () => signedInUser);
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await queryClient.query(currentUserQueryOptions(authApi));
    queryClient.setQueryData<GameRecord[]>(signedInUserGameRecordsQueryKey, []);
    queryClient.setQueryData<string[]>(categoryTreesQueryKey, ['cities']);
    queryClient.setQueryData<string[]>(adminCategoryListQueryKey, ['draft']);

    await clearCacheAfterSignOut(queryClient);

    assert.equal(
      queryClient.getQueryData(currentUserQueryOptions(authApi).queryKey),
      null,
    );
    assert.deepEqual(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query: Query) => query.queryKey),
      [currentUserQueryOptions(authApi).queryKey],
    );
  });

  it('keeps the user signed out when a current user fetch was in flight', async (context: TestContext) => {
    let resolveCurrentUser: (user: User) => void = () => undefined;
    const authApi: AuthApi = createFakeAuthApi(
      () =>
        new Promise<User>((resolve: (user: User) => void) => {
          resolveCurrentUser = resolve;
        }),
    );
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    const currentUserFetch: Promise<User | null> = queryClient
      .query(currentUserQueryOptions(authApi))
      .catch(() => null);

    await clearCacheAfterSignOut(queryClient);
    resolveCurrentUser(signedInUser);
    await currentUserFetch;

    assert.equal(
      queryClient.getQueryData(currentUserQueryOptions(authApi).queryKey),
      null,
    );
  });
});
