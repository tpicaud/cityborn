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
import type { AdminApi } from './api/adminApi';
import {
  categoriesQueryOptions,
  fullCategoryQueryOptions,
} from './api/adminQueries';
import {
  type CategoryEditorState,
  toCategoryEditorState,
} from './categoryEditorState';

type CategoryReads = Pick<AdminApi, 'getFullCategory' | 'getCategories'>;

type CategoryEditorObservation = {
  queryClient: QueryClient;
  adminApi: AdminApi;
};

type CategoryEditorObservers = {
  fullCategoryObserver: QueryObserver<FullCategory | null>;
  categoriesObserver: QueryObserver<Category[]>;
};

const editedCategoryId: CategoryId = CategoryIdSchema.parse('category-1');

const editedCategory: FullCategory = buildFullCategory({
  id: editedCategoryId,
  name: 'Paris',
  isPublished: false,
});

const categories: Category[] = [
  buildCategory({ id: editedCategoryId, name: 'Paris', isPublished: false }),
];

const networkError: TypeError = new TypeError('Network request failed');

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

async function loadCategoryEditorIgnoringFailure({
  queryClient,
  adminApi,
}: CategoryEditorObservation): Promise<void> {
  await Promise.all([
    queryClient
      .fetchQuery({
        ...fullCategoryQueryOptions({ adminApi, categoryId: editedCategoryId }),
        staleTime: 0,
      })
      .catch(() => null),
    queryClient
      .fetchQuery({ ...categoriesQueryOptions(adminApi), staleTime: 0 })
      .catch(() => null),
  ]);
}

function createCategoryEditorObservers({
  queryClient,
  adminApi,
}: CategoryEditorObservation): CategoryEditorObservers {
  return {
    fullCategoryObserver: new QueryObserver(
      queryClient,
      fullCategoryQueryOptions({ adminApi, categoryId: editedCategoryId }),
    ),
    categoriesObserver: new QueryObserver(
      queryClient,
      categoriesQueryOptions(adminApi),
    ),
  };
}

function readCategoryEditorState({
  fullCategoryObserver,
  categoriesObserver,
}: CategoryEditorObservers): CategoryEditorState {
  return toCategoryEditorState({
    fullCategoryQuery: fullCategoryObserver.getCurrentResult(),
    categoriesQuery: categoriesObserver.getCurrentResult(),
  });
}

describe('toCategoryEditorState', () => {
  it('reports a category answered as not found as missing', async (context: TestContext) => {
    const adminApi: AdminApi = createFakeAdminApi({
      getFullCategory: async () => null,
      getCategories: async () => categories,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadCategoryEditorIgnoringFailure({ queryClient, adminApi });

    const categoryEditorState: CategoryEditorState = readCategoryEditorState(
      createCategoryEditorObservers({ queryClient, adminApi }),
    );

    assert.deepEqual(categoryEditorState, { status: 'missing' });
  });

  it('reports a failed first load of the category list as failed', async (context: TestContext) => {
    const adminApi: AdminApi = createFakeAdminApi({
      getFullCategory: async () => editedCategory,
      getCategories: async () => {
        throw networkError;
      },
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadCategoryEditorIgnoringFailure({ queryClient, adminApi });

    const categoryEditorState: CategoryEditorState = readCategoryEditorState(
      createCategoryEditorObservers({ queryClient, adminApi }),
    );

    assert.deepEqual(categoryEditorState, { status: 'failed' });
  });

  it('keeps the loaded category after a failed refresh', async (context: TestContext) => {
    let fullCategoryResponse: () => Promise<FullCategory | null> = async () =>
      editedCategory;
    const adminApi: AdminApi = createFakeAdminApi({
      getFullCategory: () => fullCategoryResponse(),
      getCategories: async () => categories,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadCategoryEditorIgnoringFailure({ queryClient, adminApi });
    fullCategoryResponse = async () => {
      throw networkError;
    };
    await loadCategoryEditorIgnoringFailure({ queryClient, adminApi });

    const categoryEditorState: CategoryEditorState = readCategoryEditorState(
      createCategoryEditorObservers({ queryClient, adminApi }),
    );

    assert.deepEqual(categoryEditorState, {
      status: 'loaded',
      category: editedCategory,
      categories,
    });
  });

  it('shows the loading state when retrying after a failed load', async (context: TestContext) => {
    let resolveFullCategory: (category: FullCategory) => void = () => undefined;
    let fullCategoryResponse: () => Promise<FullCategory | null> = async () => {
      throw networkError;
    };
    const adminApi: AdminApi = createFakeAdminApi({
      getFullCategory: () => fullCategoryResponse(),
      getCategories: async () => categories,
    });
    const queryClient: QueryClient = new QueryClient();
    await loadCategoryEditorIgnoringFailure({ queryClient, adminApi });
    const categoryEditorObservers: CategoryEditorObservers =
      createCategoryEditorObservers({ queryClient, adminApi });
    let stopObservingFullCategory: () => void = () => undefined;
    const settledFailure: Promise<void> = new Promise<void>(
      (resolve: () => void) => {
        stopObservingFullCategory =
          categoryEditorObservers.fullCategoryObserver.subscribe(
            (fullCategoryQuery: QueryObserverResult<FullCategory | null>) => {
              if (fullCategoryQuery.isError && !fullCategoryQuery.isFetching) {
                resolve();
              }
            },
          );
      },
    );
    context.after(() => {
      stopObservingFullCategory();
      queryClient.clear();
    });
    await settledFailure;
    fullCategoryResponse = () =>
      new Promise<FullCategory>((resolve: (category: FullCategory) => void) => {
        resolveFullCategory = resolve;
      });

    const fullCategoryRetry: Promise<QueryObserverResult<FullCategory | null>> =
      categoryEditorObservers.fullCategoryObserver.refetch();
    const categoryEditorState: CategoryEditorState = readCategoryEditorState(
      categoryEditorObservers,
    );
    resolveFullCategory(editedCategory);
    await fullCategoryRetry;

    assert.deepEqual(categoryEditorState, { status: 'loading' });
  });
});
