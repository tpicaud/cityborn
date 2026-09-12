import type { Coord, Game, Guess, PlayerId } from '@cityborn/api';

export interface MapProps {
  center: Coord;
  zoom: number;
  preGuess: Guess | undefined;
  game: Game;
  localPlayerID: PlayerId;
  handlePreGuess: (value: Guess) => void;
}
