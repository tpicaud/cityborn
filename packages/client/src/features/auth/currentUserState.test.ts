import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { buildUser, type User } from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { AuthApi } from '../../domains/auth/authApi';
import { currentUserQueryOptions } from '../../domains/auth/authQueries';
import { type CurrentUserState, toCurrentUserState } from './currentUserState';

const signedInUser: User = buildUser();

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

describe('toCurrentUserState', () => {
  it('reports a failed first load of the current user as failed', async (context: TestContext) => {
    const authApi: AuthApi = createFakeAuthApi(async () => {
      throw networkError;
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await fetchCurrentUserIgnoringFailure({ queryClient, authApi });

    const currentUserState: CurrentUserState = observeCurrentUserState({
      queryClient,
      authApi,
    });

    assert.deepEqual(currentUserState, {
      status: 'failed',
      errorMessage: 'Une erreur inconnue est survenue, veuillez réessayer.',
    });
  });

  it('keeps the current user ready after a failed refresh', async (context: TestContext) => {
    let currentUserResponse: () => Promise<User | null> = async () =>
      signedInUser;
    const authApi: AuthApi = createFakeAuthApi(() => currentUserResponse());
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
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
  });

  it('shows the loading state when retrying after a failed first load', async (context: TestContext) => {
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
    context.after(() => {
      stopObservingCurrentUser();
      queryClient.clear();
    });
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
    resolveCurrentUser(signedInUser);
    await currentUserRetry;

    assert.deepEqual(currentUserState, { status: 'loading' });
  });
});
