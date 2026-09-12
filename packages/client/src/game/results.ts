import type { Game, PlayerResults } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';

export function getGameResult(game: Game): Map<string, PlayerResults> {
  return new Map(Object.entries(game.state.results));
}

export function getGuessObjectName(game: Game, guessObjectId: string): string {
  const guessObject = game.state.guessObjects?.find(
    (object) => object.id === guessObjectId,
  );
  return guessObject ? guessObject.name : guessObjectId;
}

export function sortPlayersByTotalPoints(
  playersResults: Map<string, PlayerResults>,
): [string, PlayerResults][] {
  return Array.from(playersResults.entries()).sort(
    ([, first], [, second]) =>
      calculateTotalPoints(second) - calculateTotalPoints(first),
  );
}
