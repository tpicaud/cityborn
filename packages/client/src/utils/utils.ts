import type { Game, PlayerResults } from '@cityborn/api';
import { v4 as uuidv4 } from 'uuid';

export function calculatePoints(distance: number) {
  return Math.max(0, Math.round(1000 * Math.exp(-0.001 * distance)));
}

export function calculateTotalPoints(results: PlayerResults) {
  return results.results.reduce((acc, result) => acc + result.points, 0);
}
export function getGameResult(game: Game): Map<string, PlayerResults> {
  const resultsMap = new Map<string, PlayerResults>();

  for (const [key, value] of Object.entries(game.state.results)) {
    resultsMap.set(key, value);
  }

  return resultsMap;
}

export function generateVisitorId(): string {
  return uuidv4();
}

export const isoToLocalDate = (
  isoString: string,
  withHours: boolean = false,
) => {
  if (!isoString) return null;

  const date = new Date(isoString);

  return withHours
    ? date.toLocaleString()
    : date.toLocaleString().split(',')[0];
};
