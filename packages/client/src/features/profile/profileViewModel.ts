'use client';

import type { GameRecord, PlayerId } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';
import { useCallback, useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { ProfileApi } from './profileApi';

export interface ProfilePlayerScoreViewModel {
  playerID: PlayerId;
  points: number;
}

export interface ProfileGameViewModel {
  gameRecord: GameRecord;
  localPlayerPoints: number;
  playerScores: ProfilePlayerScoreViewModel[];
}

export function createProfileGameViewModels(
  gameRecords: GameRecord[],
  localPlayerID: PlayerId,
): ProfileGameViewModel[] {
  return gameRecords.map((gameRecord) => ({
    gameRecord,
    localPlayerPoints: calculateTotalPoints(gameRecord.results[localPlayerID]),
    playerScores: gameRecord.players.map(({ username }) => ({
      playerID: username,
      points: calculateTotalPoints(gameRecord.results[username]),
    })),
  }));
}

export function useProfileViewModel({
  profileApi,
  localPlayerID,
}: {
  profileApi: ProfileApi;
  localPlayerID: PlayerId | undefined;
}) {
  const { invokeError } = useError();
  const [games, setGames] = useState<ProfileGameViewModel[]>([]);
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
      setGames(createProfileGameViewModels(result.data, localPlayerID));
    } finally {
      setLoading(false);
    }
  }, [invokeError, localPlayerID, profileApi]);

  return { games, loading, refreshGames };
}
