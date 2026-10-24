import type { AdminTheme } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { ThemeApi } from './themeApi';

const themesQueryKey: QueryKey = ['admin', 'themes'];
export function themesQueryOptions(themeApi: ThemeApi) {
  return queryOptions({
    queryKey: themesQueryKey,
    queryFn: async () =>
      (await themeApi.getThemes()).toSorted((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
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
  queryClient.setQueryData(
    themesQueryKey,
    themes.toSorted((a, b) => a.name.localeCompare(b.name, 'fr')),
  );
}
export function invalidateThemes(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: themesQueryKey });
}
