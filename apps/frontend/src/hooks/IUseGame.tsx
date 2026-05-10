import type { Game, Guess } from '@cityborn/api';

export interface IUseGame {
  game: Game | undefined;
  isHost: boolean;
  guess: (guess: Guess) => void;
  nextRound: () => void;
  end: () => void;
}

export interface IUseMultiGame extends IUseGame {
  connected: boolean;
  join: (gameID: string) => void;
  reconnect: (playerID: string) => void;
}
