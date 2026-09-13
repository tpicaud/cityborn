import type { Game, PlayerId } from '@cityborn/api';
import { GameStatus, RoundStatus } from '@cityborn/api';

interface GameViewModelBase {
  showNextRound: boolean;
  showResults: boolean;
  roundNumber: number | undefined;
  roundCount: number;
}

export type GameViewModel = GameViewModelBase &
  (
    | { displayState: 'loading'; localPlayerID: undefined }
    | { displayState: 'unavailable'; localPlayerID: undefined }
    | { displayState: 'playing'; localPlayerID: PlayerId }
  );

export function createGameViewModel(
  game: Game,
  localPlayerID: PlayerId | undefined,
): GameViewModel {
  const isLoading =
    (!game.state.currentRound && game.status === GameStatus.IN_GAME) ||
    game.status === GameStatus.STARTING;

  const currentRound = game.state.currentRound;
  const roundIndex = currentRound
    ? game.state.guessObjectsIds.indexOf(currentRound.guessObjectId)
    : -1;

  const gameViewModelBase: GameViewModelBase = {
    showNextRound: currentRound?.status === RoundStatus.SHOWING_RESULTS,
    showResults: game.status === GameStatus.IN_RESULTS,
    roundNumber: roundIndex === -1 ? undefined : roundIndex + 1,
    roundCount: game.state.guessObjectsIds.length,
  };

  if (isLoading) {
    return {
      ...gameViewModelBase,
      displayState: 'loading',
      localPlayerID: undefined,
    };
  }

  if (!localPlayerID) {
    return {
      ...gameViewModelBase,
      displayState: 'unavailable',
      localPlayerID: undefined,
    };
  }

  return { ...gameViewModelBase, displayState: 'playing', localPlayerID };
}
