import type { Game, Guess } from '@cityborn/api';

export interface GameComponentProps {
  game: Game;
  localPlayerID: string;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}
