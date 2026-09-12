import type { Session } from '@cityborn/api';
import { toLightGame } from '@cityborn/core';

export function buildFinalizeGameBody(
  session: Session,
): (Session & { currentGame: NonNullable<Session['currentGame']> }) | null {
  if (!session.currentGame) return null;
  return { ...session, currentGame: toLightGame(session.currentGame) };
}
