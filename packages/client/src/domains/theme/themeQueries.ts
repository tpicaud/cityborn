import type { AdminTheme } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { ThemeApi } from './themeApi';

const playableThemesCacheDurationMs: number = 60 * 60 * 1000;

const themesQueryKey: QueryKey = ['admin', 'themes'];

export function playableThemesQueryOptions(themeApi: ThemeApi) {
  return queryOptions({
    queryKey: ['theme', 'playable'],
    queryFn: () => themeApi.getPlayableThemes(),
    staleTime: playableThemesCacheDurationMs,
    gcTime: playableThemesCacheDurationMs,
    retry: false,
    meta: { reportsError: true },
  });
}

export function themesQueryOptions(themeApi: ThemeApi) {
  return queryOptions({
    queryKey: themesQueryKey,
    queryFn: () => themeApi.getThemes(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}
export function updateThemesCache({
  queryClient,
  themes,
}: {
  queryClient: QueryClient;
  themes: AdminTheme[];
}): void {
  queryClient.setQueryData(themesQueryKey, themes);
}
export function invalidateThemes(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: themesQueryKey });
}
