import type { Coord, Game, PlayerId } from '@cityborn/api';

export type GameComponentProps = {
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  game: Game;
  handleGuess: (coordinates: Coord | undefined) => Promise<void>;
  handleNextRound: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
};

export type MapProps = {
  center: Coord;
  zoom: number;
  preGuess: Coord | undefined;
  game: Game;
  localPlayerID: PlayerId;
  handlePreGuess: (coordinates: Coord) => void;
};
