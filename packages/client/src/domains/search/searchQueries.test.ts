import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import type { GuessObjectSearchResult } from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { SearchApi } from './searchApi';
import { guessObjectSearchQueryOptions } from './searchQueries';

const parisSearchResults: GuessObjectSearchResult[] = [{ name: 'Tour Eiffel' }];

function unexpectedCall(): never {
  throw new Error('unexpected search call');
}

function createFakeSearchApi({
  searchGuessObjectsByName,
}: Pick<SearchApi, 'searchGuessObjectsByName'>): SearchApi {
  return {
    searchGuessObjectsByName,
    findGuessObjectByExternalId: unexpectedCall,
    searchWorldLocationsByName: unexpectedCall,
    findWorldLocationByOsmReference: unexpectedCall,
  };
}

function waitForFirstData<TData>(
  observer: QueryObserver<TData>,
): Promise<() => void> {
  return new Promise<() => void>((resolve: (stop: () => void) => void) => {
    const stopObserving: () => void = observer.subscribe(
      (result: QueryObserverResult<TData>) => {
        if (result.data !== undefined) resolve(stopObserving);
      },
    );
  });
}

describe('guessObjectSearchQueryOptions', () => {
  it('shows no stale results while a search typed after clearing the field is pending', async (context: TestContext) => {
    let resolveNextSearch: (searchResults: GuessObjectSearchResult[]) => void =
      () => undefined;
    const searchApi: SearchApi = createFakeSearchApi({
      searchGuessObjectsByName: (searchTerm: string) => {
        if (searchTerm === 'paris') return Promise.resolve(parisSearchResults);
        return new Promise<GuessObjectSearchResult[]>(
          (resolve: (searchResults: GuessObjectSearchResult[]) => void) => {
            resolveNextSearch = resolve;
          },
        );
      },
    });
    const queryClient: QueryClient = new QueryClient();
    const searchObserver: QueryObserver<GuessObjectSearchResult[]> =
      new QueryObserver(
        queryClient,
        guessObjectSearchQueryOptions({ searchApi, searchTerm: 'paris' }),
      );
    const stopObservingSearch: () => void =
      await waitForFirstData(searchObserver);
    context.after(() => {
      resolveNextSearch([]);
      stopObservingSearch();
      queryClient.clear();
    });
    searchObserver.setOptions(
      guessObjectSearchQueryOptions({ searchApi, searchTerm: '' }),
    );
    await queryClient.query(
      guessObjectSearchQueryOptions({ searchApi, searchTerm: '' }),
    );

    searchObserver.setOptions(
      guessObjectSearchQueryOptions({ searchApi, searchTerm: 'l' }),
    );

    assert.equal(searchObserver.getCurrentResult().isPlaceholderData, true);
    assert.deepEqual(searchObserver.getCurrentResult().data, []);
  });
});
