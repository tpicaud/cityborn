import type { Game, PlayerId } from '@cityborn/api';
import { GameStatus, RoundStatus } from '@cityborn/api';

interface GameDisplayBase {
  showNextRound: boolean;
  showResults: boolean;
  roundNumber: number | undefined;
  roundCount: number;
}

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

  const currentRound = game.state.currentRound;
  const roundIndex = currentRound
    ? game.state.guessObjectsIds.indexOf(currentRound.guessObjectId)
    : -1;
  const gameDisplayBase: GameDisplayBase = {
    showNextRound: currentRound?.status === RoundStatus.SHOWING_RESULTS,
    showResults: game.status === GameStatus.IN_RESULTS,
    roundNumber: roundIndex === -1 ? undefined : roundIndex + 1,
    roundCount: game.state.guessObjectsIds.length,
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

  return { ...gameDisplayBase, state: 'playing', localPlayerID };
}
