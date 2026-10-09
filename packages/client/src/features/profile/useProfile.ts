'use client';

import type { GameRecord } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useAuth } from '../auth/authContext';
import { gameRecordsQueryOptions } from './api/profileQueries';
import { createProfileGames, type ProfileGame } from './profileGame';

type ProfileOptions = {
  isScreenFocused?: boolean;
};

export type ProfileState = {
  games: ProfileGame[];
  isLoading: boolean;
};

const noProfileGames: ProfileGame[] = [];

export function useProfile({
  isScreenFocused = true,
}: ProfileOptions = {}): ProfileState {
  const { profileApi }: DomainApis = useDomainApis();
  const { user } = useAuth();
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
