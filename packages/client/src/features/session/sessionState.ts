import type { PlayerId, Session, SessionStatus } from '@cityborn/api';
import { reconcileGuessObjects } from '@cityborn/core';

export function withStatus(session: Session, status: SessionStatus): Session {
  return { ...session, status };
}

export function isHostOf(
  session: Session | undefined,
  playerID: PlayerId | undefined,
): boolean {
  if (!session || !playerID) return false;
  return session.hostID === playerID;
}

export function mergeSessionUpdate(
  previous: Session | undefined,
  incoming: Session,
): Session {
  return {
    ...incoming,
    currentGame: reconcileGuessObjects(
      previous?.currentGame,
      incoming.currentGame,
    ),
  };
}
