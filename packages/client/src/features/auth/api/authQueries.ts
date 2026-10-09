import type { User, UserId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { AuthApi } from './authApi';

const currentUserStaleTimeMs: number = 30 * 1000;

const currentUserQueryKey: QueryKey = ['currentUser'];

const accountQueryKeyRoot: QueryKey = ['account'];

type CurrentUserCacheUpdate = {
  queryClient: QueryClient;
  user: User;
};

type CurrentUserRefresh = {
  queryClient: QueryClient;
  authApi: AuthApi;
};

export function accountQueryKey(userId: UserId | null): QueryKey {
  return [...accountQueryKeyRoot, userId];
}

export function currentUserQueryOptions(authApi: AuthApi) {
  return queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: currentUserStaleTimeMs,
    retry: false,
    meta: { reportsError: false },
  });
}

export async function setCurrentUser({
  queryClient,
  user,
}: CurrentUserCacheUpdate): Promise<void> {
  await queryClient.cancelQueries({ queryKey: currentUserQueryKey });
  queryClient.setQueryData<User | null>(currentUserQueryKey, user);
}

export async function clearCurrentUser(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: currentUserQueryKey });
  queryClient.removeQueries({ queryKey: accountQueryKeyRoot });
  queryClient.setQueryData<User | null>(currentUserQueryKey, null);
}

export function invalidateCurrentUser(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
}

export function refreshCurrentUser({
  queryClient,
  authApi,
}: CurrentUserRefresh): Promise<User | null> {
  return queryClient.fetchQuery({
    ...currentUserQueryOptions(authApi),
    staleTime: 0,
  });
}
