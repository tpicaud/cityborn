'use client';

import type { GameRecord } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { gameRecordsQueryOptions } from './api/profileQueries';
import { createProfileGames, type ProfileGame } from './profileGame';

export type ProfileGamesOptions = {
  isScreenFocused?: boolean;
};

export type ProfileGames = {
  games: ProfileGame[];
  isLoading: boolean;
};

const noProfileGames: ProfileGame[] = [];

export function useProfileGames({
  isScreenFocused = true,
}: ProfileGamesOptions = {}): ProfileGames {
  const { profileApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const { data: gameRecords, isLoading }: UseQueryResult<GameRecord[]> =
    useQuery({
      ...gameRecordsQueryOptions({ profileApi, userId: user?.id ?? null }),
      subscribed: isScreenFocused,
    });

  const games: ProfileGame[] = useMemo<ProfileGame[]>(() => {
    if (!user || !gameRecords) return noProfileGames;
    return createProfileGames(gameRecords, user);
  }, [gameRecords, user]);

  return { games, isLoading };
}
