import type { Coord, Game, Guess } from '@cityborn/api';

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: string;
  handlePreGuess: (value: Guess) => void;
}
