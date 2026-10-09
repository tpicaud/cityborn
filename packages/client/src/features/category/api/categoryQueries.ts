import { queryOptions } from '@tanstack/react-query';
import type { CategoryApi } from './categoryApi';

const categoryTreesCacheDurationMs: number = 60 * 60 * 1000;

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
