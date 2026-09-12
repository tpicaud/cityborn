import type { Session } from '@cityborn/api';
import { toLightGame } from '@cityborn/core';

export type FinalizeGameBody = Session & {
  currentGame: NonNullable<Session['currentGame']>;
};

export function buildFinalizeGameBody(
  session: Session,
): FinalizeGameBody | null {
  if (!session.currentGame) return null;
  return { ...session, currentGame: toLightGame(session.currentGame) };
}
