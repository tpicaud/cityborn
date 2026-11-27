'use client';

import type { CatalogSection, Pack, Theme, ThemeId } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { playableCatalogSectionsQueryOptions } from '../../domains/catalog-section/catalogSectionQueries';
import { publishedPacksQueryOptions } from '../../domains/pack/packQueries';
import { playableThemesQueryOptions } from '../../domains/theme/themeQueries';
import { type CatalogRow, createCatalogRows } from './catalogRows';
import { selectThemePacks } from './themePacks';

const noPacks: Pack[] = [];
const noThemes: Theme[] = [];
const noCatalogSections: CatalogSection[] = [];

export type ThemeFilteredPacksOptions = {
  isScreenFocused?: boolean;
};

export type ThemeFilteredPacks = {
  isLoading: boolean;
  themes: Theme[];
  selectedTheme: Theme | undefined;
  selectTheme: (themeId: ThemeId | undefined) => void;
  packs: Pack[];
  catalogRows: CatalogRow[];
  catalogSectionsLoadFailed: boolean;
  reloadCatalogSections: () => Promise<void>;
};

export function useThemeFilteredPacks({
  isScreenFocused = true,
}: ThemeFilteredPacksOptions = {}): ThemeFilteredPacks {
  const { catalogSectionApi, packApi, themeApi }: DomainApis = useDomainApis();
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
  const {
    data: catalogSections = noCatalogSections,
    isPending: isLoadingCatalogSections,
    isLoadingError: isCatalogSectionsLoadError,
    refetch: refetchCatalogSections,
  }: UseQueryResult<CatalogSection[]> = useQuery({
    ...playableCatalogSectionsQueryOptions(catalogSectionApi),
    meta: { reportsError: false },
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

  const catalogRows: CatalogRow[] = useMemo(
    () =>
      createCatalogRows({
        sections: catalogSections,
        publishedPacks,
        themeId: selectedTheme?.id,
      }),
    [catalogSections, publishedPacks, selectedTheme],
  );

  return {
    isLoading: isLoadingPacks || isLoadingThemes || isLoadingCatalogSections,
    themes,
    selectedTheme,
    selectTheme: setSelectedThemeId,
    packs,
    catalogRows,
    catalogSectionsLoadFailed: isCatalogSectionsLoadError,
    reloadCatalogSections: async () => {
      await refetchCatalogSections();
    },
  };
}
