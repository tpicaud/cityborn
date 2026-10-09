import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type GameRecord,
  type User,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { AuthApi } from './authApi';
import {
  accountQueryKey,
  clearCurrentUser,
  currentUserQueryOptions,
} from './authQueries';

const signedInUser: User = {
  id: UserIdSchema.parse('user-1'),
  username: UsernameSchema.parse('citizen'),
  email: 'citizen@cityborn.fr',
  type: 'email',
  role: 'player',
  isVerified: true,
};

const signedInUserGameRecordsQueryKey: QueryKey = [
  ...accountQueryKey(signedInUser.id),
  'gameRecords',
];

const categoryTreesQueryKey: QueryKey = ['category', 'trees'];

function unexpectedCall(): never {
  throw new Error('unexpected auth call');
}

function createFakeAuthApi(getCurrentUser: AuthApi['getCurrentUser']): AuthApi {
  return {
    getCurrentUser,
    signIn: unexpectedCall,
    signUp: unexpectedCall,
    signInWithGoogle: unexpectedCall,
    signInWithApple: unexpectedCall,
    signOut: unexpectedCall,
    deleteUser: unexpectedCall,
    updatePassword: unexpectedCall,
    resendVerificationEmail: unexpectedCall,
    verifyEmail: unexpectedCall,
  };
}

test('clearCurrentUser signs the user out and drops the account data but keeps shared data', async () => {
  const authApi: AuthApi = createFakeAuthApi(async () => signedInUser);
  const queryClient: QueryClient = new QueryClient();
  await queryClient.fetchQuery(currentUserQueryOptions(authApi));
  queryClient.setQueryData<GameRecord[]>(signedInUserGameRecordsQueryKey, []);
  queryClient.setQueryData<string[]>(categoryTreesQueryKey, ['cities']);

  await clearCurrentUser(queryClient);

  assert.equal(
    queryClient.getQueryData(currentUserQueryOptions(authApi).queryKey),
    null,
  );
  assert.equal(
    queryClient.getQueryCache().find({
      queryKey: signedInUserGameRecordsQueryKey,
    }),
    undefined,
  );
  assert.deepEqual(queryClient.getQueryData(categoryTreesQueryKey), ['cities']);
  queryClient.clear();
});

test('clearCurrentUser keeps the user signed out when a current user fetch was in flight', async () => {
  let resolveCurrentUser: (user: User) => void = () => undefined;
  const authApi: AuthApi = createFakeAuthApi(
    () =>
      new Promise<User>((resolve: (user: User) => void) => {
        resolveCurrentUser = resolve;
      }),
  );
  const queryClient: QueryClient = new QueryClient();
  const currentUserFetch: Promise<User | null> = queryClient
    .fetchQuery(currentUserQueryOptions(authApi))
    .catch(() => null);

  await clearCurrentUser(queryClient);
  resolveCurrentUser(signedInUser);
  await currentUserFetch;

  assert.equal(
    queryClient.getQueryData(currentUserQueryOptions(authApi).queryKey),
    null,
  );
  queryClient.clear();
});
