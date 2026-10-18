import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildGuessObject,
  buildGuessObjectDraft,
  buildWorldLocation,
  type CreateGuessObject,
  type GuessObject,
  type GuessObjectId,
  GuessObjectIdSchema,
  type GuessObjectSearchResult,
} from '@cityborn/api';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { GuessObjectApi } from '../../domains/guess-object/guessObjectApi';
import { guessObjectQueryOptions } from '../../domains/guess-object/guessObjectQueries';
import type { SearchApi } from '../../domains/search/searchApi';
import { guessObjectSearchQueryOptions } from '../../domains/search/searchQueries';
import { saveGuessObject } from './guessObjectSave';

const savedGuessObjectId: GuessObjectId = GuessObjectIdSchema.parse(
  '00000000-0000-4000-8000-000000000021',
);

const createdGuessObject: CreateGuessObject = {
  ...buildGuessObjectDraft(),
  world_location_id: buildWorldLocation().id,
};

function unexpectedCall(): never {
  throw new Error('unexpected api call');
}

const guessObjectApi: GuessObjectApi = {
  getGuessObject: unexpectedCall,
  getFullGuessObject: unexpectedCall,
  createGuessObject: () => Promise.resolve(savedGuessObjectId),
  updateGuessObject: unexpectedCall,
};

const searchApi: SearchApi = {
  searchGuessObjectsByName: unexpectedCall,
  findGuessObjectByExternalId: unexpectedCall,
  searchWorldLocationsByName: unexpectedCall,
  findWorldLocationByOsmReference: unexpectedCall,
};

describe('saveGuessObject', () => {
  it('marks guess objects and searches stale once the guess object is saved', async (context: TestContext) => {
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    const guessObjectQueryKey: QueryKey = guessObjectQueryOptions({
      guessObjectApi,
      guessObjectId: savedGuessObjectId,
    }).queryKey;
    const searchQueryKey: QueryKey = guessObjectSearchQueryOptions({
      searchApi,
      searchTerm: 'eiffel',
    }).queryKey;
    queryClient.setQueryData<GuessObject>(
      guessObjectQueryKey,
      buildGuessObject({ id: savedGuessObjectId }),
    );
    queryClient.setQueryData<GuessObjectSearchResult[]>(searchQueryKey, []);

    await saveGuessObject({
      guessObjectApi,
      queryClient,
      guessObject: createdGuessObject,
    });

    assert.equal(
      queryClient.getQueryState(guessObjectQueryKey)?.isInvalidated,
      true,
    );
    assert.equal(
      queryClient.getQueryState(searchQueryKey)?.isInvalidated,
      true,
    );
  });
});
