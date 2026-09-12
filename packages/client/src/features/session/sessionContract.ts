import type { GameConfig, Guess, Session } from '@cityborn/api';

/**
 * Contrat commun aux sessions solo et multi. Toutes les actions renvoient une
 * promesse : le solo résout de façon synchrone là où le multi attend l'accusé
 * de réception du serveur, et les écrans attendent les deux de la même manière.
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
