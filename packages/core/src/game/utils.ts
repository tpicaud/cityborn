import type { Game, PlayerResults } from '@cityborn/api';

export function calculatePoints(distance: number): number {
  return Math.max(0, Math.round(1000 * Math.exp(-0.001 * distance)));
}

export function calculateTotalPoints(results: PlayerResults): number {
  return results.results.reduce((acc, result) => acc + result.points, 0);
}

export function toLightGame(game: Game): Game {
  const { guessObjects, ...restState } = game.state;

  return { ...game, state: restState };
}
