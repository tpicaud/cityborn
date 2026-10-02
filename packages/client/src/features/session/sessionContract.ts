import type { GameConfig, Guess, PlayerId, Session } from '@cityborn/api';

export type SessionController = {
  session: Session | undefined;
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: Guess) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
};
