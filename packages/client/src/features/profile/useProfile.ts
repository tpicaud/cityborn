'use client';

import type { PlayerId } from '@cityborn/api';
import { useCallback, useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { ProfileApi } from './profileApi';
import { createProfileGames, type ProfileGame } from './profileGame';

export interface ProfileOptions {
  profileApi: ProfileApi;
  localPlayerID: PlayerId | undefined;
}

export function useProfile({ profileApi, localPlayerID }: ProfileOptions) {
  const { invokeError } = useError();
  const [games, setGames] = useState<ProfileGame[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshGames = useCallback(async () => {
    if (!localPlayerID) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await profileApi.getGameRecords();
      if (!result.ok) return invokeError(result.error);
      setGames(createProfileGames(result.data, localPlayerID));
    } finally {
      setLoading(false);
    }
  }, [invokeError, localPlayerID, profileApi]);

  return { games, loading, refreshGames };
}
