'use client';

import {
  type GuessObjectSearchResult,
  getFriendlyErrorMessage,
  parseApiError,
  resolveErrorMessage,
  type WorldLocationSearchResult,
} from '@cityborn/api';
import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  guessObjectSearchQueryOptions,
  worldLocationSearchQueryOptions,
} from '../../domains/search/searchQueries';

type NameSearch<TSearchResult> = {
  searchResults: TSearchResult[];
  searchErrorMessage: string | null;
};

export type GuessObjectSearchOptions = {
  searchTerm: string;
};

export type GuessObjectSearch = NameSearch<GuessObjectSearchResult>;

export type WorldLocationSearchOptions = {
  searchTerm: string;
};

export type WorldLocationSearch = NameSearch<WorldLocationSearchResult>;

type DebouncedSearchOptions<TSearchResult> = {
  searchTerm: string;
  toSearchQueryOptions: (
    debouncedSearchTerm: string,
  ) => UseQueryOptions<TSearchResult[], Error, TSearchResult[], QueryKey>;
};

const searchDelayMs: number = 300;

const noSearchResults: never[] = [];

function useDebouncedSearchTerm(searchTerm: string): string {
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(searchTerm);

  useEffect(() => {
    if (searchTerm === '') {
      setDebouncedSearchTerm('');
      return;
    }
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      searchDelayMs,
    );
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return debouncedSearchTerm;
}

function toSearchErrorMessage(searchError: Error | null): string | null {
  if (!searchError) return null;
  return resolveErrorMessage(
    searchError,
    getFriendlyErrorMessage(parseApiError(0, searchError)),
  );
}

function useDebouncedSearch<TSearchResult>({
  searchTerm,
  toSearchQueryOptions,
}: DebouncedSearchOptions<TSearchResult>): NameSearch<TSearchResult> {
  const debouncedSearchTerm: string = useDebouncedSearchTerm(searchTerm);
  const searchQuery: UseQueryResult<TSearchResult[]> = useQuery(
    toSearchQueryOptions(debouncedSearchTerm),
  );

  if (searchTerm === '') {
    return { searchResults: noSearchResults, searchErrorMessage: null };
  }
  return {
    searchResults: searchQuery.data ?? noSearchResults,
    searchErrorMessage: toSearchErrorMessage(searchQuery.error),
  };
}

export function useGuessObjectSearch({
  searchTerm,
}: GuessObjectSearchOptions): GuessObjectSearch {
  const { searchApi }: DomainApis = useDomainApis();
  return useDebouncedSearch({
    searchTerm,
    toSearchQueryOptions: (debouncedSearchTerm: string) =>
      guessObjectSearchQueryOptions({
        searchApi,
        searchTerm: debouncedSearchTerm,
      }),
  });
}

export function useWorldLocationSearch({
  searchTerm,
}: WorldLocationSearchOptions): WorldLocationSearch {
  const { searchApi }: DomainApis = useDomainApis();
  return useDebouncedSearch({
    searchTerm,
    toSearchQueryOptions: (debouncedSearchTerm: string) =>
      worldLocationSearchQueryOptions({
        searchApi,
        searchTerm: debouncedSearchTerm,
      }),
  });
}
