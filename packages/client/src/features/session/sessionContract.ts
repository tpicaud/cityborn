import type {
  GameConfigChanges,
  Guess,
  PlayerId,
  Session,
} from '@cityborn/api';

export type SessionController = {
  session: Session | undefined;
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  updateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: Guess) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
};
