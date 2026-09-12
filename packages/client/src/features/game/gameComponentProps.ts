import type { Game, Guess, PlayerId } from '@cityborn/api';

export interface GameComponentProps {
  game: Game;
  localPlayerID: PlayerId;
  handleGuess: (guess: Guess) => void;
  handleNextRound: () => void;
}
