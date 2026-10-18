import type { UserId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
  skipToken,
} from '@tanstack/react-query';
import { accountQueryKey } from '../auth/authQueries';
import type { GameRecordApi } from './gameRecordApi';

type GameRecordsQuery = {
  gameRecordApi: GameRecordApi;
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
  gameRecordApi,
  userId,
}: GameRecordsQuery) {
  return queryOptions({
    queryKey: gameRecordsQueryKey(userId),
    queryFn: userId === null ? skipToken : () => gameRecordApi.getGameRecords(),
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
