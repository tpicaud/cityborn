'use client';

import type { GameRecord, User } from '@cityborn/api';
import { useCallback, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import { createProfileGames, type ProfileGame } from './profileGame';

export type ProfileOptions = {
  localUser: Pick<User, 'id' | 'username'> | undefined;
};

export type ProfileState = {
  games: ProfileGame[];
  loading: boolean;
  refreshGames: () => Promise<void>;
};

export function useProfile({ localUser }: ProfileOptions): ProfileState {
  const { profileApi }: DomainApis = useDomainApis();
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
