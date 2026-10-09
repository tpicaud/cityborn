import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  type Category,
  type CategoryId,
  CategoryIdSchema,
  type FullCategory,
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
  invalidateCategoriesAfterDeletion,
  reloadCategories,
} from './adminQueries';

type CategoryReads = Pick<AdminApi, 'getFullCategory' | 'getCategories'>;

const deletedCategoryId: CategoryId = CategoryIdSchema.parse('category-1');

const deletedCategory: FullCategory = {
  id: deletedCategoryId,
  name: 'Paris',
  isPublished: false,
  guessObjects: [],
};

const categories: Category[] = [
  { id: deletedCategoryId, name: 'Paris', isPublished: false },
];

function unexpectedCall(): never {
  throw new Error('unexpected admin call');
}

function createFakeAdminApi({
  getFullCategory,
  getCategories,
}: CategoryReads): AdminApi {
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
    searchGuessObjectsByName: unexpectedCall,
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

test('invalidating categories after a deletion marks them stale without refetching the displayed deleted category', async () => {
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

  await invalidateCategoriesAfterDeletion(queryClient);

  assert.equal(fullCategoryRequestCount, 1);
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
    getFullCategory: unexpectedCall,
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
