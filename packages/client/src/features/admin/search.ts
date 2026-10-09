'use client';

import type {
  GuessObjectSearchResult,
  WorldLocationSearchResult,
} from '@cityborn/api';
import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  guessObjectSearchQueryOptions,
  worldLocationSearchQueryOptions,
} from './api/adminQueries';

type DebouncedSearch<TSearchResult> = {
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
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      searchDelayMs,
    );
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return debouncedSearchTerm;
}

function useDebouncedSearch<TSearchResult>({
  searchTerm,
  toSearchQueryOptions,
}: DebouncedSearch<TSearchResult>): TSearchResult[] {
  const debouncedSearchTerm: string = useDebouncedSearchTerm(searchTerm);
  const {
    data: searchResults = noSearchResults,
  }: UseQueryResult<TSearchResult[]> = useQuery(
    toSearchQueryOptions(debouncedSearchTerm),
  );

  if (searchTerm === '' || debouncedSearchTerm === '') return noSearchResults;
  return searchResults;
}

export function useGuessObjectSearch(
  searchTerm: string,
): GuessObjectSearchResult[] {
  const { adminApi }: DomainApis = useDomainApis();
  return useDebouncedSearch({
    searchTerm,
    toSearchQueryOptions: (debouncedSearchTerm: string) =>
      guessObjectSearchQueryOptions({
        adminApi,
        searchTerm: debouncedSearchTerm,
      }),
  });
}

export function useWorldLocationSearch(
  searchTerm: string,
): WorldLocationSearchResult[] {
  const { adminApi }: DomainApis = useDomainApis();
  return useDebouncedSearch({
    searchTerm,
    toSearchQueryOptions: (debouncedSearchTerm: string) =>
      worldLocationSearchQueryOptions({
        adminApi,
        searchTerm: debouncedSearchTerm,
      }),
  });
}
