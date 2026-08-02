import type { Session } from '../schemas/session.schema';

export function buildEndSoloGameBody(session: Session) {
  if (!session.currentGame) return null;
  const { guessObjects: _removed, ...state } = session.currentGame.state;
  return { ...session, currentGame: { ...session.currentGame, state } };
}
