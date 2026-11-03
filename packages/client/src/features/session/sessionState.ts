import type { PlayerId, Session, SessionStatus } from '@cityborn/api';

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
