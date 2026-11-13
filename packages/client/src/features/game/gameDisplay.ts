import type { Game, PlayerId } from '@cityborn/api';
import { GameStatus } from '@cityborn/api';

type GameDisplayBase = {
  showResults: boolean;
  showOptions: boolean;
};

export type GameDisplay = GameDisplayBase &
  (
    | { state: 'loading'; localPlayerID: undefined }
    | { state: 'unavailable'; localPlayerID: undefined }
    | { state: 'playing'; localPlayerID: PlayerId }
  );

export function createGameDisplay(
  game: Game,
  localPlayerID: PlayerId | undefined,
): GameDisplay {
  const isLoading =
    (!game.state.currentRound && game.status === GameStatus.IN_GAME) ||
    game.status === GameStatus.STARTING;

  const gameDisplayBase: GameDisplayBase = {
    showResults: game.status === GameStatus.IN_RESULTS,
    showOptions: false,
  };

  if (isLoading) {
    return {
      ...gameDisplayBase,
      state: 'loading',
      localPlayerID: undefined,
    };
  }

  if (!localPlayerID) {
    return {
      ...gameDisplayBase,
      state: 'unavailable',
      localPlayerID: undefined,
    };
  }

  return {
    ...gameDisplayBase,
    showOptions: game.status === GameStatus.IN_GAME,
    state: 'playing',
    localPlayerID,
  };
}
