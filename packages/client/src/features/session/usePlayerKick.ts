'use client';

import type { PlayerId } from '@cityborn/api';
import { useCallback, useState } from 'react';

export type PlayerKickOptions = {
  kickPlayer: (kickedPlayerID: PlayerId) => Promise<void>;
};

export type PlayerKick = {
  isConfirmationOpen: boolean;
  targetPlayerID: PlayerId | undefined;
  requestKick: (playerID: PlayerId) => void;
  cancelKick: () => void;
  confirmKick: () => Promise<void>;
};

export function usePlayerKick({ kickPlayer }: PlayerKickOptions): PlayerKick {
  const [targetPlayerID, setTargetPlayerID] = useState<PlayerId>();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);

  const requestKick: PlayerKick['requestKick'] = useCallback(
    (playerID: PlayerId) => {
      setTargetPlayerID(playerID);
      setIsConfirmationOpen(true);
    },
    [],
  );
  const cancelKick: PlayerKick['cancelKick'] = useCallback(
    () => setIsConfirmationOpen(false),
    [],
  );

  const confirmKick: PlayerKick['confirmKick'] = useCallback(async () => {
    if (!targetPlayerID) return;
    await kickPlayer(targetPlayerID);
    setIsConfirmationOpen(false);
  }, [kickPlayer, targetPlayerID]);

  return {
    isConfirmationOpen,
    targetPlayerID,
    requestKick,
    cancelKick,
    confirmKick,
  };
}
