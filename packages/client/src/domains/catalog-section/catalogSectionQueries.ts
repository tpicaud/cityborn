import type { CatalogSection } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { CatalogSectionApi } from './catalogSectionApi';

const playableCatalogSectionsCacheDurationMs: number = 60 * 60 * 1000;

const catalogSectionsQueryKey: QueryKey = ['admin', 'catalog-sections'];

export function playableCatalogSectionsQueryOptions(
  catalogSectionApi: CatalogSectionApi,
) {
  return queryOptions({
    queryKey: ['catalog-section', 'playable'],
    queryFn: () => catalogSectionApi.getPlayableCatalogSections(),
    staleTime: playableCatalogSectionsCacheDurationMs,
    gcTime: playableCatalogSectionsCacheDurationMs,
    retry: false,
    meta: { reportsError: true },
  });
}

export function catalogSectionsQueryOptions(
  catalogSectionApi: CatalogSectionApi,
) {
  return queryOptions({
    queryKey: catalogSectionsQueryKey,
    queryFn: () => catalogSectionApi.getCatalogSections(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export async function updateCatalogSectionsCache({
  queryClient,
  update,
}: {
  queryClient: QueryClient;
  update: (sections: CatalogSection[]) => CatalogSection[];
}): Promise<void> {
  await queryClient.cancelQueries({ queryKey: catalogSectionsQueryKey });
  queryClient.setQueryData<CatalogSection[]>(
    catalogSectionsQueryKey,
    (sections) => sections && update(sections),
  );
  await queryClient.invalidateQueries({ queryKey: catalogSectionsQueryKey });
}
