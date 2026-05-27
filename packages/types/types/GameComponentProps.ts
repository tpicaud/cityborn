import type { Game } from './Game';
import type { Guess } from './Guess';

export interface GameComponentProps {
  game: Game;
  localPlayerID: string;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}
