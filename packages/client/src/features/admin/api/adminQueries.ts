import type {
  Category,
  CategoryId,
  GuessObjectId,
  GuessObjectSearchResult,
  WorldLocationSearchResult,
} from '@cityborn/api';
import {
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { AdminApi, OsmWorldLocationReference } from './adminApi';

type GuessObjectRepresentation = {
  guessObjectId: GuessObjectId;
  representation: 'preview' | 'full';
};

type FullCategoryQuery = {
  adminApi: AdminApi;
  categoryId: CategoryId;
};

type GuessObjectQuery = {
  adminApi: AdminApi;
  guessObjectId: GuessObjectId;
};

type NameSearchQuery = {
  adminApi: AdminApi;
  searchTerm: string;
};

type NameSearchTarget = 'guessObjects' | 'worldLocations';

type NameSearchDefinition<TSearchResult> = {
  searchTarget: NameSearchTarget;
  searchTerm: string;
  searchByName: (searchTerm: string) => Promise<TSearchResult[]>;
};

type CategoryDeletion = {
  queryClient: QueryClient;
  categoryId: CategoryId;
};

type GuessObjectExternalIdQuery = {
  adminApi: AdminApi;
  externalId: string;
};

type OsmWorldLocationQuery = {
  adminApi: AdminApi;
  osmWorldLocationReference: OsmWorldLocationReference;
};

const nameSearchStaleTimeMs: number = 60 * 1000;

const categoriesQueryKeyRoot: QueryKey = ['admin', 'categories'];

const categoryListQueryKey: QueryKey = [...categoriesQueryKeyRoot, 'list'];

const guessObjectsQueryKeyRoot: QueryKey = ['admin', 'guessObjects'];

const searchQueryKeyRoot: QueryKey = ['admin', 'search'];

function fullCategoryQueryKey(categoryId: CategoryId): QueryKey {
  return [...categoriesQueryKeyRoot, 'full', categoryId];
}

function guessObjectQueryKey({
  guessObjectId,
  representation,
}: GuessObjectRepresentation): QueryKey {
  return [...guessObjectsQueryKeyRoot, guessObjectId, representation];
}

function searchQueryKey(searchCriteria: readonly string[]): QueryKey {
  return [...searchQueryKeyRoot, ...searchCriteria];
}

export function categoriesQueryOptions(adminApi: AdminApi) {
  return queryOptions({
    queryKey: categoryListQueryKey,
    queryFn: () => adminApi.getCategories(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function fullCategoryQueryOptions({
  adminApi,
  categoryId,
}: FullCategoryQuery) {
  return queryOptions({
    queryKey: fullCategoryQueryKey(categoryId),
    queryFn: () => adminApi.getFullCategory(categoryId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function guessObjectQueryOptions({
  adminApi,
  guessObjectId,
}: GuessObjectQuery) {
  return queryOptions({
    queryKey: guessObjectQueryKey({
      guessObjectId,
      representation: 'preview',
    }),
    queryFn: () => adminApi.getGuessObject(guessObjectId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function fullGuessObjectQueryOptions({
  adminApi,
  guessObjectId,
}: GuessObjectQuery) {
  return queryOptions({
    queryKey: guessObjectQueryKey({ guessObjectId, representation: 'full' }),
    queryFn: () => adminApi.getFullGuessObject(guessObjectId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

function nameSearchQueryOptions<TSearchResult>({
  searchTarget,
  searchTerm,
  searchByName,
}: NameSearchDefinition<TSearchResult>) {
  return queryOptions({
    queryKey: searchQueryKey([searchTarget, 'name', searchTerm]),
    queryFn: (): Promise<TSearchResult[]> =>
      searchTerm === '' ? Promise.resolve([]) : searchByName(searchTerm),
    staleTime: nameSearchStaleTimeMs,
    retry: false,
    placeholderData: keepPreviousData,
    meta: { reportsError: false },
  });
}

export function guessObjectSearchQueryOptions({
  adminApi,
  searchTerm,
}: NameSearchQuery) {
  return nameSearchQueryOptions<GuessObjectSearchResult>({
    searchTarget: 'guessObjects',
    searchTerm,
    searchByName: (guessObjectName: string) =>
      adminApi.searchGuessObjectsByName(guessObjectName),
  });
}

export function guessObjectByExternalIdQueryOptions({
  adminApi,
  externalId,
}: GuessObjectExternalIdQuery) {
  return queryOptions({
    queryKey: searchQueryKey(['guessObjects', 'externalId', externalId]),
    queryFn: () => adminApi.findGuessObjectByExternalId(externalId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function worldLocationSearchQueryOptions({
  adminApi,
  searchTerm,
}: NameSearchQuery) {
  return nameSearchQueryOptions<WorldLocationSearchResult>({
    searchTarget: 'worldLocations',
    searchTerm,
    searchByName: (worldLocationName: string) =>
      adminApi.searchWorldLocationsByName(worldLocationName),
  });
}

export function worldLocationByOsmReferenceQueryOptions({
  adminApi,
  osmWorldLocationReference,
}: OsmWorldLocationQuery) {
  return queryOptions({
    queryKey: searchQueryKey([
      'worldLocations',
      'osm',
      osmWorldLocationReference.osmType,
      osmWorldLocationReference.osmId,
    ]),
    queryFn: () =>
      adminApi.findWorldLocationByOsmReference(osmWorldLocationReference),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
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

export function invalidateSearches(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: searchQueryKeyRoot,
    refetchType: 'none',
  });
}

export async function invalidateGuessObjects(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: guessObjectsQueryKeyRoot }),
    invalidateSearches(queryClient),
  ]);
}
