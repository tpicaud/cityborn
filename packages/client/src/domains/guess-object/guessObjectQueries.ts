import type { GuessObjectId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { GuessObjectApi } from './guessObjectApi';

type GuessObjectRepresentation = {
  guessObjectId: GuessObjectId;
  representation: 'preview' | 'full';
};

type GuessObjectQuery = {
  guessObjectApi: GuessObjectApi;
  guessObjectId: GuessObjectId;
};

const guessObjectsQueryKeyRoot: QueryKey = ['admin', 'guessObjects'];

function guessObjectQueryKey({
  guessObjectId,
  representation,
}: GuessObjectRepresentation): QueryKey {
  return [...guessObjectsQueryKeyRoot, guessObjectId, representation];
}

export function guessObjectQueryOptions({
  guessObjectApi,
  guessObjectId,
}: GuessObjectQuery) {
  return queryOptions({
    queryKey: guessObjectQueryKey({
      guessObjectId,
      representation: 'preview',
    }),
    queryFn: () => guessObjectApi.getGuessObject(guessObjectId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function fullGuessObjectQueryOptions({
  guessObjectApi,
  guessObjectId,
}: GuessObjectQuery) {
  return queryOptions({
    queryKey: guessObjectQueryKey({ guessObjectId, representation: 'full' }),
    queryFn: () => guessObjectApi.getFullGuessObject(guessObjectId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function invalidateGuessObjects(
  queryClient: QueryClient,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: guessObjectsQueryKeyRoot });
}
