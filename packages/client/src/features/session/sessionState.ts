import type { Game, GameConfig, Guess, PlayerId, Session } from '@cityborn/api';
import { SessionStatus } from '@cityborn/api';
import {
  applyGuess,
  beginGame,
  reconcileGuessObjects,
  resolveNextRound,
} from '@cityborn/core';

export function withHost(session: Session, hostID: PlayerId): Session {
  return { ...session, hostID };
}

export function withStatus(session: Session, status: SessionStatus): Session {
  return { ...session, status };
}

export function withGameConfig(
  session: Session,
  gameConfig: Partial<GameConfig>,
): Session {
  return { ...session, gameConfig: { ...session.gameConfig, ...gameConfig } };
}

export function withGame(session: Session, currentGame: Game): Session {
  return { ...session, currentGame };
}

export function withoutGame(session: Session): Session {
  return { ...session, currentGame: undefined };
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

export function startSoloGame(session: Session, createdGame: Game): Session {
  return {
    ...session,
    status: SessionStatus.IN_GAME,
    currentGame: beginGame(createdGame),
  };
}

export function applySoloGuess(
  session: Session,
  playerID: PlayerId,
  guess: Guess,
): Session {
  const game = session.currentGame;
  if (!game?.state.currentRound) return session;
  return withGame(session, applyGuess(game, playerID, guess, [playerID]));
}

export function advanceSoloRound(session: Session): {
  session: Session;
  isGameOver: boolean;
} {
  const game = session.currentGame;
  if (!game) return { session, isGameOver: false };
  const { game: nextGame, isGameOver } = resolveNextRound(game);
  return { session: withGame(session, nextGame), isGameOver };
}
