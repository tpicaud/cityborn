import { type QueryKey, queryOptions } from '@tanstack/react-query';
import type { ThemeApi } from './themeApi';

const themesCacheDurationMs: number = 60 * 60 * 1000;

const themesQueryKey: QueryKey = ['admin', 'themes'];

export function themesQueryOptions(themeApi: ThemeApi) {
  return queryOptions({
    queryKey: themesQueryKey,
    queryFn: () => themeApi.getThemes(),
    staleTime: themesCacheDurationMs,
    retry: false,
    meta: { reportsError: true },
  });
}
