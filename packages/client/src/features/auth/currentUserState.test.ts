import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getFriendlyErrorMessage,
  parseApiError,
  type User,
  UserIdSchema,
  UsernameSchema,
} from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { AuthApi } from './api/authApi';
import { currentUserQueryOptions } from './api/authQueries';
import { type CurrentUserState, toCurrentUserState } from './currentUserState';

const signedInUser: User = {
  id: UserIdSchema.parse('user-1'),
  username: UsernameSchema.parse('citizen'),
  email: 'citizen@cityborn.fr',
  type: 'email',
  role: 'player',
  isVerified: true,
};

const networkError: TypeError = new TypeError('Network request failed');

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

async function fetchCurrentUserIgnoringFailure({
  queryClient,
  authApi,
}: {
  queryClient: QueryClient;
  authApi: AuthApi;
}): Promise<void> {
  await queryClient
    .fetchQuery({ ...currentUserQueryOptions(authApi), staleTime: 0 })
    .catch(() => null);
}

function observeCurrentUserState({
  queryClient,
  authApi,
}: {
  queryClient: QueryClient;
  authApi: AuthApi;
}): CurrentUserState {
  const currentUserObserver: QueryObserver<User | null> = new QueryObserver(
    queryClient,
    currentUserQueryOptions(authApi),
  );
  return toCurrentUserState(currentUserObserver.getCurrentResult());
}

test('a failed first load of the current user is reported as failed', async () => {
  const authApi: AuthApi = createFakeAuthApi(async () => {
    throw networkError;
  });
  const queryClient: QueryClient = new QueryClient();
  await fetchCurrentUserIgnoringFailure({ queryClient, authApi });

  const currentUserState: CurrentUserState = observeCurrentUserState({
    queryClient,
    authApi,
  });

  assert.deepEqual(currentUserState, {
    status: 'failed',
    errorMessage: getFriendlyErrorMessage(parseApiError(0, networkError)),
  });
  queryClient.clear();
});

test('a failed refresh keeps the current user ready', async () => {
  let currentUserResponse: () => Promise<User | null> = async () =>
    signedInUser;
  const authApi: AuthApi = createFakeAuthApi(() => currentUserResponse());
  const queryClient: QueryClient = new QueryClient();
  await fetchCurrentUserIgnoringFailure({ queryClient, authApi });
  currentUserResponse = async () => {
    throw networkError;
  };
  await fetchCurrentUserIgnoringFailure({ queryClient, authApi });

  const currentUserState: CurrentUserState = observeCurrentUserState({
    queryClient,
    authApi,
  });

  assert.deepEqual(currentUserState, { status: 'ready', user: signedInUser });
  queryClient.clear();
});

test('retrying after a failed first load shows the loading state', async () => {
  let resolveCurrentUser: (user: User) => void = () => undefined;
  let currentUserResponse: () => Promise<User | null> = async () => {
    throw networkError;
  };
  const authApi: AuthApi = createFakeAuthApi(() => currentUserResponse());
  const queryClient: QueryClient = new QueryClient();
  const currentUserObserver: QueryObserver<User | null> = new QueryObserver(
    queryClient,
    currentUserQueryOptions(authApi),
  );
  let stopObservingCurrentUser: () => void = () => undefined;
  const firstLoadFailure: Promise<void> = new Promise<void>(
    (resolve: () => void) => {
      stopObservingCurrentUser = currentUserObserver.subscribe(
        (currentUserQuery: QueryObserverResult<User | null>) => {
          if (currentUserQuery.isError) resolve();
        },
      );
    },
  );
  await firstLoadFailure;
  currentUserResponse = () =>
    new Promise<User>((resolve: (user: User) => void) => {
      resolveCurrentUser = resolve;
    });

  const currentUserRetry: Promise<QueryObserverResult<User | null>> =
    currentUserObserver.refetch();
  const currentUserState: CurrentUserState = toCurrentUserState(
    currentUserObserver.getCurrentResult(),
  );

  assert.deepEqual(currentUserState, { status: 'loading' });
  resolveCurrentUser(signedInUser);
  await currentUserRetry;
  stopObservingCurrentUser();
  queryClient.clear();
});
