import type {
  GuessObjectSearchResult,
  WorldLocationSearchResult,
} from '@cityborn/api';
import {
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { OsmWorldLocationReference, SearchApi } from './searchApi';

type NameSearchQuery = {
  searchApi: SearchApi;
  searchTerm: string;
};

type NameSearchTarget = 'guessObjects' | 'worldLocations';

type NameSearchDefinition<TSearchResult> = {
  searchTarget: NameSearchTarget;
  searchTerm: string;
  searchByName: (searchTerm: string) => Promise<TSearchResult[]>;
};

type GuessObjectExternalIdQuery = {
  searchApi: SearchApi;
  externalId: string;
};

type OsmWorldLocationQuery = {
  searchApi: SearchApi;
  osmWorldLocationReference: OsmWorldLocationReference;
};

const nameSearchStaleTimeMs: number = 60 * 1000;

const searchQueryKeyRoot: QueryKey = ['admin', 'search'];

function searchQueryKey(searchCriteria: readonly string[]): QueryKey {
  return [...searchQueryKeyRoot, ...searchCriteria];
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
  searchApi,
  searchTerm,
}: NameSearchQuery) {
  return nameSearchQueryOptions<GuessObjectSearchResult>({
    searchTarget: 'guessObjects',
    searchTerm,
    searchByName: (guessObjectName: string) =>
      searchApi.searchGuessObjectsByName(guessObjectName),
  });
}

export function guessObjectByExternalIdQueryOptions({
  searchApi,
  externalId,
}: GuessObjectExternalIdQuery) {
  return queryOptions({
    queryKey: searchQueryKey(['guessObjects', 'externalId', externalId]),
    queryFn: () => searchApi.findGuessObjectByExternalId(externalId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function worldLocationSearchQueryOptions({
  searchApi,
  searchTerm,
}: NameSearchQuery) {
  return nameSearchQueryOptions<WorldLocationSearchResult>({
    searchTarget: 'worldLocations',
    searchTerm,
    searchByName: (worldLocationName: string) =>
      searchApi.searchWorldLocationsByName(worldLocationName),
  });
}

export function worldLocationByOsmReferenceQueryOptions({
  searchApi,
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
      searchApi.findWorldLocationByOsmReference(osmWorldLocationReference),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}

export function invalidateSearches(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: searchQueryKeyRoot,
    refetchType: 'none',
  });
}
