'use client';

import type { PlayerId } from '@cityborn/api';
import { useCallback, useState } from 'react';

export type PlayerKickOptions = {
  kickPlayer: (kickedPlayerID: PlayerId) => Promise<void>;
};

export type PlayerKick = {
  pendingPlayerID: PlayerId | undefined;
  requestKick: (playerID: PlayerId) => void;
  cancelKick: () => void;
  confirmKick: () => Promise<void>;
};

export function usePlayerKick({ kickPlayer }: PlayerKickOptions): PlayerKick {
  const [pendingPlayerID, setPendingPlayerID] = useState<PlayerId>();

  const requestKick: PlayerKick['requestKick'] = useCallback(
    (playerID: PlayerId) => setPendingPlayerID(playerID),
    [],
  );
  const cancelKick: PlayerKick['cancelKick'] = useCallback(
    () => setPendingPlayerID(undefined),
    [],
  );

  const confirmKick: PlayerKick['confirmKick'] = useCallback(async () => {
    if (!pendingPlayerID) return;
    await kickPlayer(pendingPlayerID);
    setPendingPlayerID(undefined);
  }, [kickPlayer, pendingPlayerID]);

  return { pendingPlayerID, requestKick, cancelKick, confirmKick };
}
