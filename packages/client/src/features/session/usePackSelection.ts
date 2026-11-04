'use client';

import type {
  GameConfigChanges,
  GameConfigPack,
  Pack,
  Session,
  Theme,
  ThemeId,
} from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { publishedPacksQueryOptions } from '../../domains/pack/packQueries';
import { playableThemesQueryOptions } from '../../domains/theme/themeQueries';
import { selectThemePacks } from './themePacks';

const noPacks: Pack[] = [];
const noThemes: Theme[] = [];

function toGameConfigPack(pack: Pack): GameConfigPack {
  return {
    id: pack.id,
    name: pack.name,
    isPublished: pack.isPublished,
    description: pack.description,
    parentId: pack.parentId,
  };
}

export type PackSelectionOptions = {
  session: Session;
  isHost: boolean;
  updateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  startGame: () => Promise<void>;
};

export type PackSelection = {
  isLoading: boolean;
  themes: Theme[];
  selectedTheme: Theme | undefined;
  selectTheme: (themeId: ThemeId | undefined) => void;
  packs: Pack[];
  playPack: (pack: Pack) => Promise<void>;
};

export function usePackSelection({
  session,
  isHost,
  updateGameConfig,
  startGame,
}: PackSelectionOptions): PackSelection {
  const { packApi, themeApi }: DomainApis = useDomainApis();
  const {
    data: publishedPacks = noPacks,
    isPending: isLoadingPacks,
  }: UseQueryResult<Pack[]> = useQuery(publishedPacksQueryOptions(packApi));
  const {
    data: themes = noThemes,
    isPending: isLoadingThemes,
  }: UseQueryResult<Theme[]> = useQuery(playableThemesQueryOptions(themeApi));
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId | undefined>(
    undefined,
  );

  const selectedTheme: Theme | undefined = themes.find(
    (theme: Theme) => theme.id === selectedThemeId,
  );

  const packs: Pack[] = useMemo(
    () =>
      selectThemePacks({ packs: publishedPacks, themeId: selectedTheme?.id }),
    [publishedPacks, selectedTheme],
  );

  const allPacks: GameConfigPack[] = useMemo(
    () => publishedPacks.map(toGameConfigPack),
    [publishedPacks],
  );

  const hasPacks: boolean = session.gameConfig.packs.length > 0;

  useEffect(() => {
    if (!isHost || hasPacks || allPacks.length === 0) return;
    updateGameConfig({ packs: allPacks });
  }, [isHost, hasPacks, allPacks, updateGameConfig]);

  const playPack: PackSelection['playPack'] = async (pack: Pack) => {
    await updateGameConfig({ packs: [toGameConfigPack(pack)] });
    await startGame();
  };

  return {
    isLoading: isLoadingPacks || isLoadingThemes,
    themes,
    selectedTheme,
    selectTheme: setSelectedThemeId,
    packs,
    playPack,
  };
}
