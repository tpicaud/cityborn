import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type Category,
  type CategoryId,
  CategoryIdSchema,
  type FullCategory,
  type GuessObjectSearchResult,
} from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { AdminApi } from './adminApi';
import {
  categoriesQueryOptions,
  fullCategoryQueryOptions,
  guessObjectSearchQueryOptions,
  reloadCategories,
  removeDeletedCategory,
} from './adminQueries';

type AdminReads = Partial<
  Pick<
    AdminApi,
    'getFullCategory' | 'getCategories' | 'searchGuessObjectsByName'
  >
>;

const deletedCategoryId: CategoryId = CategoryIdSchema.parse('category-1');

const deletedCategory: FullCategory = {
  id: deletedCategoryId,
  name: 'Paris',
  isPublished: false,
  guessObjects: [],
};

const keptCategory: Category = {
  id: CategoryIdSchema.parse('category-2'),
  name: 'Lyon',
  isPublished: true,
};

const categories: Category[] = [
  { id: deletedCategoryId, name: 'Paris', isPublished: false },
  keptCategory,
];

const parisSearchResults: GuessObjectSearchResult[] = [{ name: 'Tour Eiffel' }];

function unexpectedCall(): never {
  throw new Error('unexpected admin call');
}

function createFakeAdminApi({
  getFullCategory = unexpectedCall,
  getCategories = unexpectedCall,
  searchGuessObjectsByName = unexpectedCall,
}: AdminReads): AdminApi {
  return {
    getCategories,
    getFullCategory,
    createCategory: unexpectedCall,
    updateCategory: unexpectedCall,
    deleteCategory: unexpectedCall,
    getGuessObject: unexpectedCall,
    getFullGuessObject: unexpectedCall,
    createGuessObject: unexpectedCall,
    updateGuessObject: unexpectedCall,
    searchGuessObjectsByName,
    findGuessObjectByExternalId: unexpectedCall,
    searchWorldLocationsByName: unexpectedCall,
    findWorldLocationByOsmReference: unexpectedCall,
    createWorldLocation: unexpectedCall,
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

test('removing a deleted category drops it from the list and marks categories stale without refetching the displayed deleted category', async () => {
  let fullCategoryRequestCount: number = 0;
  const adminApi: AdminApi = createFakeAdminApi({
    getFullCategory: async () => {
      fullCategoryRequestCount += 1;
      return deletedCategory;
    },
    getCategories: async () => categories,
  });
  const queryClient: QueryClient = new QueryClient();
  const fullCategoryObserver: QueryObserver<FullCategory | null> =
    new QueryObserver(
      queryClient,
      fullCategoryQueryOptions({ adminApi, categoryId: deletedCategoryId }),
    );
  await queryClient.fetchQuery(categoriesQueryOptions(adminApi));
  const stopObservingFullCategory: () => void =
    await waitForFirstData(fullCategoryObserver);

  await removeDeletedCategory({ queryClient, categoryId: deletedCategoryId });

  assert.equal(fullCategoryRequestCount, 1);
  assert.deepEqual(
    queryClient.getQueryData(categoriesQueryOptions(adminApi).queryKey),
    [keptCategory],
  );
  assert.equal(
    queryClient.getQueryState(
      fullCategoryQueryOptions({ adminApi, categoryId: deletedCategoryId })
        .queryKey,
    )?.isInvalidated,
    true,
  );
  assert.equal(
    queryClient.getQueryState(categoriesQueryOptions(adminApi).queryKey)
      ?.isInvalidated,
    true,
  );
  stopObservingFullCategory();
  queryClient.clear();
});

test('reloading the categories drops the displayed list until the new response arrives', async () => {
  let resolveCategories: (reloadedCategories: Category[]) => void = () =>
    undefined;
  let categoriesResponse: () => Promise<Category[]> = async () => categories;
  const adminApi: AdminApi = createFakeAdminApi({
    getCategories: () => categoriesResponse(),
  });
  const queryClient: QueryClient = new QueryClient();
  const categoriesObserver: QueryObserver<Category[]> = new QueryObserver(
    queryClient,
    categoriesQueryOptions(adminApi),
  );
  const stopObservingCategories: () => void =
    await waitForFirstData(categoriesObserver);
  categoriesResponse = () =>
    new Promise<Category[]>(
      (resolve: (reloadedCategories: Category[]) => void) => {
        resolveCategories = resolve;
      },
    );

  const categoriesReload: Promise<void> = reloadCategories(queryClient);

  assert.equal(categoriesObserver.getCurrentResult().isPending, true);
  resolveCategories(categories);
  await categoriesReload;
  assert.deepEqual(categoriesObserver.getCurrentResult().data, categories);
  stopObservingCategories();
  queryClient.clear();
});

test('a name search typed after clearing the field shows no stale results while pending', async () => {
  let resolveNextSearch: (searchResults: GuessObjectSearchResult[]) => void =
    () => undefined;
  const adminApi: AdminApi = createFakeAdminApi({
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
      guessObjectSearchQueryOptions({ adminApi, searchTerm: 'paris' }),
    );
  const stopObservingSearch: () => void =
    await waitForFirstData(searchObserver);

  searchObserver.setOptions(
    guessObjectSearchQueryOptions({ adminApi, searchTerm: '' }),
  );
  await queryClient.fetchQuery(
    guessObjectSearchQueryOptions({ adminApi, searchTerm: '' }),
  );
  searchObserver.setOptions(
    guessObjectSearchQueryOptions({ adminApi, searchTerm: 'l' }),
  );

  assert.equal(searchObserver.getCurrentResult().isPlaceholderData, true);
  assert.deepEqual(searchObserver.getCurrentResult().data, []);
  resolveNextSearch([]);
  stopObservingSearch();
  queryClient.clear();
});
