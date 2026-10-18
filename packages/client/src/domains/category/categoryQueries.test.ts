import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildCategory,
  buildFullCategory,
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
import type { CategoryApi } from './categoryApi';
import {
  categoriesQueryOptions,
  fullCategoryQueryOptions,
  reloadCategories,
  removeDeletedCategory,
} from './categoryQueries';

type CategoryReads = Partial<
  Pick<CategoryApi, 'getFullCategory' | 'getCategories'>
>;

const deletedCategoryId: CategoryId = CategoryIdSchema.parse('category-1');

const deletedCategory: FullCategory = buildFullCategory({
  id: deletedCategoryId,
  name: 'Paris',
  isPublished: false,
});

const keptCategory: Category = buildCategory({
  id: 'category-2',
  name: 'Lyon',
  isPublished: true,
});

const categories: Category[] = [
  buildCategory({ id: deletedCategoryId, name: 'Paris', isPublished: false }),
  keptCategory,
];

function unexpectedCall(): never {
  throw new Error('unexpected category call');
}

function createFakeCategoryApi({
  getFullCategory = unexpectedCall,
  getCategories = unexpectedCall,
}: CategoryReads): CategoryApi {
  return {
    getCategoryTrees: unexpectedCall,
    getCategories,
    getFullCategory,
    createCategory: unexpectedCall,
    updateCategory: unexpectedCall,
    deleteCategory: unexpectedCall,
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

describe('removeDeletedCategory', () => {
  it('drops the category from the list and marks categories stale without refetching the displayed deleted category', async (context: TestContext) => {
    let fullCategoryRequestCount: number = 0;
    const categoryApi: CategoryApi = createFakeCategoryApi({
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
        fullCategoryQueryOptions({
          categoryApi,
          categoryId: deletedCategoryId,
        }),
      );
    await queryClient.fetchQuery(categoriesQueryOptions(categoryApi));
    const stopObservingFullCategory: () => void =
      await waitForFirstData(fullCategoryObserver);
    context.after(() => {
      stopObservingFullCategory();
      queryClient.clear();
    });

    await removeDeletedCategory({ queryClient, categoryId: deletedCategoryId });

    assert.equal(fullCategoryRequestCount, 1);
    assert.deepEqual(
      queryClient.getQueryData(categoriesQueryOptions(categoryApi).queryKey),
      [keptCategory],
    );
    assert.equal(
      queryClient.getQueryState(
        fullCategoryQueryOptions({ categoryApi, categoryId: deletedCategoryId })
          .queryKey,
      )?.isInvalidated,
      true,
    );
    assert.equal(
      queryClient.getQueryState(categoriesQueryOptions(categoryApi).queryKey)
        ?.isInvalidated,
      true,
    );
  });
});

describe('reloadCategories', () => {
  it('drops the displayed list until the new response arrives', async (context: TestContext) => {
    let resolveCategories: (reloadedCategories: Category[]) => void = () =>
      undefined;
    let categoriesResponse: () => Promise<Category[]> = async () => categories;
    const categoryApi: CategoryApi = createFakeCategoryApi({
      getCategories: () => categoriesResponse(),
    });
    const queryClient: QueryClient = new QueryClient();
    const categoriesObserver: QueryObserver<Category[]> = new QueryObserver(
      queryClient,
      categoriesQueryOptions(categoryApi),
    );
    const stopObservingCategories: () => void =
      await waitForFirstData(categoriesObserver);
    context.after(() => {
      stopObservingCategories();
      queryClient.clear();
    });
    categoriesResponse = () =>
      new Promise<Category[]>(
        (resolve: (reloadedCategories: Category[]) => void) => {
          resolveCategories = resolve;
        },
      );

    const categoriesReload: Promise<void> = reloadCategories(queryClient);
    const isPendingDuringReload: boolean =
      categoriesObserver.getCurrentResult().isPending;
    resolveCategories(categories);
    await categoriesReload;

    assert.equal(isPendingDuringReload, true);
    assert.deepEqual(categoriesObserver.getCurrentResult().data, categories);
  });
});
