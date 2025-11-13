import { Coord } from './Coord.js';
import { Guess } from './Guess.js';
import { Game } from './Game.js';

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: string;
  handlePreGuess: (value: Guess) => void;
}
