import type { CreateGuessObject, GuessObjectId } from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { GuessObjectApi } from '../../domains/guess-object/guessObjectApi';
import { invalidateGuessObjects } from '../../domains/guess-object/guessObjectQueries';
import { invalidateSearches } from '../../domains/search/searchQueries';

type GuessObjectSave = {
  guessObjectApi: GuessObjectApi;
  queryClient: QueryClient;
  guessObjectId?: GuessObjectId;
  guessObject: CreateGuessObject;
};

export async function saveGuessObject({
  guessObjectApi,
  queryClient,
  guessObjectId,
  guessObject,
}: GuessObjectSave): Promise<GuessObjectId> {
  const savedGuessObjectId: GuessObjectId = guessObjectId
    ? await guessObjectApi.updateGuessObject({ guessObjectId, guessObject })
    : await guessObjectApi.createGuessObject(guessObject);
  await Promise.all([
    invalidateGuessObjects(queryClient),
    invalidateSearches(queryClient),
  ]);
  return savedGuessObjectId;
}
