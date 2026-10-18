import type { Category, CategoryId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { CategoryApi } from './categoryApi';

type FullCategoryQuery = {
  categoryApi: CategoryApi;
  categoryId: CategoryId;
};

type CategoryDeletion = {
  queryClient: QueryClient;
  categoryId: CategoryId;
};

const categoryTreesCacheDurationMs: number = 60 * 60 * 1000;

const categoriesQueryKeyRoot: QueryKey = ['admin', 'categories'];

const categoryListQueryKey: QueryKey = [...categoriesQueryKeyRoot, 'list'];

function fullCategoryQueryKey(categoryId: CategoryId): QueryKey {
  return [...categoriesQueryKeyRoot, 'full', categoryId];
}

export function categoryTreesQueryOptions(categoryApi: CategoryApi) {
  return queryOptions({
    queryKey: ['category', 'trees'],
    queryFn: () => categoryApi.getCategoryTrees(),
    staleTime: categoryTreesCacheDurationMs,
    gcTime: categoryTreesCacheDurationMs,
    retry: false,
    meta: { reportsError: true },
  });
}

export function categoriesQueryOptions(categoryApi: CategoryApi) {
  return queryOptions({
    queryKey: categoryListQueryKey,
    queryFn: () => categoryApi.getCategories(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function fullCategoryQueryOptions({
  categoryApi,
  categoryId,
}: FullCategoryQuery) {
  return queryOptions({
    queryKey: fullCategoryQueryKey(categoryId),
    queryFn: () => categoryApi.getFullCategory(categoryId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function reloadCategories(queryClient: QueryClient): Promise<void> {
  return queryClient.resetQueries({
    queryKey: categoryListQueryKey,
    exact: true,
  });
}

export function invalidateCategories(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: categoriesQueryKeyRoot });
}

export function markCategoriesStale(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: categoriesQueryKeyRoot,
    refetchType: 'none',
  });
}

export function removeDeletedCategory({
  queryClient,
  categoryId,
}: CategoryDeletion): Promise<void> {
  queryClient.setQueryData<Category[]>(
    categoryListQueryKey,
    (categories: Category[] | undefined) =>
      categories?.filter((category: Category) => category.id !== categoryId),
  );
  return markCategoriesStale(queryClient);
}
