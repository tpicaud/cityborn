import type { Game, PlayerResults } from '@cityborn/api';

export function getGameResult(game: Game): Map<string, PlayerResults> {
  const resultsMap = new Map<string, PlayerResults>();

  for (const [key, value] of Object.entries(game.state.results)) {
    resultsMap.set(key, value);
  }

  return resultsMap;
}
