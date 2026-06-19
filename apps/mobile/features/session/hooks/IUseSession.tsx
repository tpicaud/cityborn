import type { GameConfig, Guess, Session } from '@cityborn/api';

export interface IUseSession {
  session: Session | undefined;
  isHost: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => void | Promise<void>;

  // Game
  startGame: () => Promise<void>;
  guess: (guess: Guess) => void;
  nextRound: () => void;
  endGame: () => void;
  playAgain: () => void;
  exitGame: () => Promise<void>;
}
