import type { GameConfig, Guess, Session } from '@cityborn/api';

/**
 * Session commands shared by the solo and multi flows. They never reject:
 * failures are surfaced through the shared error dialog, so callers can invoke
 * them directly without wrapping them in a try/catch.
 */
export interface SessionController {
  session: Session | undefined;
  isHost: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: Guess) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
}

/**
 * `join`, `reconnect`, `updateHost` and `kickPlayer` reject with an
 * `ApiResponseError` so the caller can react to the outcome.
 */
export interface MultiSessionController extends SessionController {
  isSocketConnected: boolean;
  isJoined: boolean;
  hasDisconnected: boolean;
  join: (playerID: string) => Promise<void>;
  updateHost: (newHostID: string) => Promise<void>;
  kickPlayer: (playerToKick: string) => Promise<void>;
  reconnect: () => Promise<void>;
}
