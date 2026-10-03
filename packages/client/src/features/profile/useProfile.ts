'use client';

import type { GameRecord, User } from '@cityborn/api';
import { useCallback, useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { ProfileApi } from './profileApi';
import { createProfileGames, type ProfileGame } from './profileGame';

export type ProfileOptions = {
  profileApi: ProfileApi;
  localUser: Pick<User, 'id' | 'username'> | undefined;
};

export type ProfileState = {
  games: ProfileGame[];
  loading: boolean;
  refreshGames: () => Promise<void>;
};

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
      const gameRecords: GameRecord[] = await profileApi.getGameRecords();
      setGames(createProfileGames(gameRecords, localUser));
    } catch (error: unknown) {
      invokeError(error);
    } finally {
      setLoading(false);
    }
  }, [invokeError, localUser, profileApi]);

  return { games, loading, refreshGames };
}
