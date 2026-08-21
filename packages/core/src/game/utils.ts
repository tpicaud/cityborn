import type { Game, PlayerResults } from '@cityborn/api';

export function calculatePoints(distance: number): number {
  return Math.max(0, Math.round(1000 * Math.exp(-0.001 * distance)));
}

export function calculateTotalPoints(results: PlayerResults): number {
  return results.results.reduce((acc, result) => acc + result.points, 0);
}

export function reconcileGuessObjects(
  localGame: Game | undefined,
  incomingGame: Game | undefined,
): Game | undefined {
  if (!incomingGame) return undefined;

  return {
    ...incomingGame,
    state: {
      ...incomingGame.state,
      guessObjects:
        incomingGame.state.guessObjects ?? localGame?.state.guessObjects,
    },
  };
}
