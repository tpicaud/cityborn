import type { Coord } from './Coord';
import type { Game } from './Game';
import type { Guess } from './Guess';

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: string;
  handlePreGuess: (value: Guess) => void;
}
