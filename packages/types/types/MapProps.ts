import type { Coord } from './Coord.js';
import type { Game } from './Game.js';
import type { Guess } from './Guess.js';

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: string;
  handlePreGuess: (value: Guess) => void;
}
