import type { Coord } from './Coord.js';

export interface Guess {
  coordinates: Coord;
  distance: number;
  points: number;
  win: boolean;
}
