'use client';
import {
  type CatalogSection,
  type Pack,
  resolveErrorMessage,
} from '@cityborn/api';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import {
  type DomainApis,
  useDomainApis,
} from '../../../../domains/apiProvider';
import { packsQueryOptions } from '../../../../domains/pack/packQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../../../shared/errorReporter';
import {
  type CatalogSectionPackMutations,
  createCatalogSectionPackMutations,
} from './catalogSectionPackMutations';
import {
  createEmptyPackCandidatesMessage,
  searchCatalogSectionPackCandidates,
  selectCatalogSectionPacks,
} from './catalogSectionPacks';

export type CatalogSectionPacksOptions = {
  section: CatalogSection;
};

export type CatalogSectionPacks = CatalogSectionPackMutations & {
  sectionPacks: Pack[];
  packQuery: string;
  searchPacks: (query: string) => void;
  packCandidates: Pack[];
  emptyPackCandidatesMessage: string | null;
  isSaving: boolean;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
};

const noPacks: Pack[] = [];

export function useCatalogSectionPacks({
  section,
}: CatalogSectionPacksOptions): CatalogSectionPacks {
  const { catalogSectionApi, packApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const query: UseQueryResult<Pack[]> = useQuery({
    ...packsQueryOptions(packApi),
    meta: { reportsError: false },
  });
  const [packQuery, setPackQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const packs: Pack[] = query.data ?? noPacks;
  const packCandidates: Pack[] = searchCatalogSectionPackCandidates({
    section,
    packs,
    query: packQuery,
  });
  return {
    sectionPacks: selectCatalogSectionPacks({ section, packs }),
    packQuery,
    searchPacks: setPackQuery,
    packCandidates,
    emptyPackCandidatesMessage:
      packCandidates.length === 0
        ? createEmptyPackCandidatesMessage({ section, packs })
        : null,
    isSaving,
    isLoading: query.isPending,
    loadError: query.isError ? resolveErrorMessage(query.error) : null,
    reload: () => {
      query.refetch();
    },
    ...createCatalogSectionPackMutations({
      catalogSectionApi,
      queryClient,
      section,
      reportError,
      setIsSaving,
    }),
  };
}
