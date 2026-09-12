'use client';

import { useCallback, useEffect, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type { UserGateway } from '../../ports/gateways';
import {
  type GameRecordViewModel,
  toGameRecordViewModels,
} from '../game-record-view-model';

export interface GameRecordsState {
  gameRecords: GameRecordViewModel[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useGameRecords(
  userGateway: UserGateway,
  username: string | undefined,
): GameRecordsState {
  const { invokeError } = useError();
  const [gameRecords, setGameRecords] = useState<GameRecordViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!username) {
      setGameRecords([]);
      return;
    }

    setIsLoading(true);
    const result = await userGateway.getGameRecords();
    setIsLoading(false);
    if (!result.ok) return invokeError(result.error);
    setGameRecords(toGameRecordViewModels(result.data, username));
  }, [userGateway, username, invokeError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { gameRecords, isLoading, reload };
}
