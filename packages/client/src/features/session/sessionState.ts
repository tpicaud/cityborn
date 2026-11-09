import { type PlayerId, type Session, SessionStatus } from '@cityborn/api';

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

export function hasSessionStarted(session: Session | undefined): boolean {
  return session?.status === SessionStatus.IN_GAME || !!session?.currentGame;
}
