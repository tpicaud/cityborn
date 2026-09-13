import type { Game, Guess, PlayerId } from '@cityborn/api';

export interface GameComponentProps {
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  game: Game;
  handleGuess: (guess: Guess) => Promise<void>;
  handleNextRound: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
}
