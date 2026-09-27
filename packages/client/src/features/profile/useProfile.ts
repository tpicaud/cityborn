'use client';

import type { ApiResult, GameRecord, User } from '@cityborn/api';
import { useCallback, useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { ProfileApi } from './profileApi';
import { createProfileGames, type ProfileGame } from './profileGame';

export interface ProfileOptions {
  profileApi: ProfileApi;
  localUser: Pick<User, 'id' | 'username'> | undefined;
}

export interface ProfileState {
  games: ProfileGame[];
  loading: boolean;
  refreshGames: () => Promise<void>;
}

export function useProfile({
  profileApi,
  localUser,
}: ProfileOptions): ProfileState {
  const { invokeError } = useError();
  const [games, setGames] = useState<ProfileGame[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshGames = useCallback(async (): Promise<void> => {
    if (!localUser) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result: ApiResult<GameRecord[]> = await profileApi.getGameRecords();
      if (!result.ok) return invokeError(result.error);
      setGames(createProfileGames(result.data, localUser));
    } finally {
      setLoading(false);
    }
  }, [invokeError, localUser, profileApi]);

  return { games, loading, refreshGames };
}
