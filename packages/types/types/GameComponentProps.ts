import type { Game } from './Game.js';
import type { Guess } from './Guess.js';

export interface GameComponentProps {
  game: Game;
  localPlayerID: string;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}
