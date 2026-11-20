import type { PlayerId, Session } from '@cityborn/api';

export function isHostOf(
  session: Session | undefined,
  playerID: PlayerId | undefined,
): boolean {
  if (!session || !playerID) return false;
  return session.hostID === playerID;
}
