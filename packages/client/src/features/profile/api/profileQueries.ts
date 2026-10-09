import type { UserId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
  skipToken,
} from '@tanstack/react-query';
import { accountQueryKey } from '../../auth/api/authQueries';
import type { ProfileApi } from './profileApi';

type GameRecordsQuery = {
  profileApi: ProfileApi;
  userId: UserId | null;
};

type GameRecordsInvalidation = {
  queryClient: QueryClient;
  userId: UserId;
};

function gameRecordsQueryKey(userId: UserId | null): QueryKey {
  return [...accountQueryKey(userId), 'gameRecords'];
}

export function gameRecordsQueryOptions({
  profileApi,
  userId,
}: GameRecordsQuery) {
  return queryOptions({
    queryKey: gameRecordsQueryKey(userId),
    queryFn: userId === null ? skipToken : () => profileApi.getGameRecords(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function invalidateGameRecords({
  queryClient,
  userId,
}: GameRecordsInvalidation): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: gameRecordsQueryKey(userId),
  });
}
