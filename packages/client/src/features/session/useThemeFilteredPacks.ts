'use client';

import type { CatalogSection, Pack, Theme, ThemeId } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { publishedSectionsQueryOptions } from '../../domains/catalog-section/catalogSectionQueries';
import { publishedPacksQueryOptions } from '../../domains/pack/packQueries';
import { playableThemesQueryOptions } from '../../domains/theme/themeQueries';
import {
  createPackCatalogSections,
  type PackCatalogSection,
} from './catalogSections';
import { selectThemePacks } from './themePacks';

const noPacks: Pack[] = [];
const noSections: CatalogSection[] = [];
const noThemes: Theme[] = [];

export type ThemeFilteredPacksOptions = {
  isScreenFocused?: boolean;
};

export type ThemeFilteredPacks = {
  isLoading: boolean;
  themes: Theme[];
  selectedTheme: Theme | undefined;
  selectTheme: (themeId: ThemeId | undefined) => void;
  packs: Pack[];
  sections: PackCatalogSection[];
  hasSectionsError: boolean;
  isReloadingSections: boolean;
  reloadSections: () => void;
};

export function useThemeFilteredPacks({
  isScreenFocused = true,
}: ThemeFilteredPacksOptions = {}): ThemeFilteredPacks {
  const { packApi, themeApi, catalogSectionApi }: DomainApis = useDomainApis();
  const {
    data: publishedPacks = noPacks,
    isPending: isLoadingPacks,
  }: UseQueryResult<Pack[]> = useQuery({
    ...publishedPacksQueryOptions(packApi),
    subscribed: isScreenFocused,
  });
  const {
    data: themes = noThemes,
    isPending: isLoadingThemes,
  }: UseQueryResult<Theme[]> = useQuery({
    ...playableThemesQueryOptions(themeApi),
    subscribed: isScreenFocused,
  });
  const sectionsQuery: UseQueryResult<CatalogSection[]> = useQuery({
    ...publishedSectionsQueryOptions(catalogSectionApi),
    subscribed: isScreenFocused,
  });
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!isScreenFocused) setSelectedThemeId(undefined);
  }, [isScreenFocused]);

  const selectedTheme: Theme | undefined = themes.find(
    (theme: Theme) => theme.id === selectedThemeId,
  );

  const packs: Pack[] = useMemo(
    () =>
      selectThemePacks({ packs: publishedPacks, themeId: selectedTheme?.id }),
    [publishedPacks, selectedTheme],
  );

  const sections: PackCatalogSection[] = useMemo(
    () =>
      createPackCatalogSections({
        sections: sectionsQuery.isError
          ? noSections
          : (sectionsQuery.data ?? noSections),
        packs: publishedPacks,
        themeId: selectedTheme?.id,
      }),
    [sectionsQuery.data, sectionsQuery.isError, publishedPacks, selectedTheme],
  );

  return {
    sections,
    hasSectionsError: sectionsQuery.isError,
    isReloadingSections: sectionsQuery.isFetching,
    reloadSections: () => {
      void sectionsQuery.refetch();
    },
    isLoading: isLoadingPacks || isLoadingThemes,
    themes,
    selectedTheme,
    selectTheme: setSelectedThemeId,
    packs,
  };
}
