import type { CatalogSection } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { CatalogSectionApi } from './catalogSectionApi';

const sectionsQueryKey: QueryKey = ['admin', 'catalog-sections'];
const publishedSectionsQueryKey: QueryKey = ['catalog-section', 'published'];
export function publishedSectionsQueryOptions(api: CatalogSectionApi) {
  return queryOptions({
    queryKey: publishedSectionsQueryKey,
    queryFn: () => api.getPublishedSections(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}
export function sectionsQueryOptions(api: CatalogSectionApi) {
  return queryOptions({
    queryKey: sectionsQueryKey,
    queryFn: () => api.getSections(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}
export function updateSectionsCache({
  queryClient,
  sections,
}: {
  queryClient: QueryClient;
  sections: CatalogSection[];
}): void {
  queryClient.setQueryData(sectionsQueryKey, sections);
  void queryClient.invalidateQueries({ queryKey: publishedSectionsQueryKey });
}
export function updateSectionCache({
  queryClient,
  section,
}: {
  queryClient: QueryClient;
  section: CatalogSection;
}): void {
  queryClient.setQueryData<CatalogSection[]>(sectionsQueryKey, (sections) =>
    sections?.some(({ id }) => id === section.id)
      ? sections.map((current) =>
          current.id === section.id ? section : current,
        )
      : [...(sections ?? []), section],
  );
  void queryClient.invalidateQueries({ queryKey: publishedSectionsQueryKey });
}
export function removeSectionCache({
  queryClient,
  id,
}: {
  queryClient: QueryClient;
  id: CatalogSection['id'];
}): void {
  queryClient.setQueryData<CatalogSection[]>(sectionsQueryKey, (sections) =>
    sections?.filter((section) => section.id !== id),
  );
  void queryClient.invalidateQueries({ queryKey: publishedSectionsQueryKey });
}
