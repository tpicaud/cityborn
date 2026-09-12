import type { Coord, Game, Guess } from '@cityborn/api';

export const DEFAULT_MAP_CENTER: Readonly<Coord> = {
  lat: 48.8566,
  lng: 2.3522,
};
export const DEFAULT_MAP_ZOOM = 2;

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: string;
  handlePreGuess: (value: Guess) => void;
}
