import type {
  PlayerResults as ApiPlayerResults,
  Game,
  GuessObjectId,
  PlayerId,
  Result,
} from '@cityborn/api';
import { PlayerIdSchema } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';
import { formatDistanceInKm } from './roundResult';

export type GameResultRow = {
  key: string;
  position: number;
  label: string;
  detail?: string;
  score: number;
  highlighted: boolean;
};

export type GameResults = {
  totalPoints: number;
  ranking: GameResultRow[] | undefined;
  rounds: GameResultRow[];
};

type PlayerTotal = {
  playerID: PlayerId;
  totalPoints: number;
};

function guessObjectName({
  game,
  guessObjectID,
}: {
  game: Game;
  guessObjectID: GuessObjectId;
}): string {
  return (
    game.state.roundGuessObjects?.find(({ id }) => id === guessObjectID)
      ?.name ?? guessObjectID
  );
}

function formatRoundDistance(distance: number): string {
  return distance === -1 ? 'Trop tard' : `${formatDistanceInKm(distance)} km`;
}

function bestRoundIndex(results: Result[]): number {
  const bestPoints: number = Math.max(
    0,
    ...results.map(({ points }) => points),
  );
  return bestPoints > 0
    ? results.findIndex(({ points }) => points === bestPoints)
    : -1;
}

function createRoundRows({
  game,
  results,
}: {
  game: Game;
  results: Result[];
}): GameResultRow[] {
  const bestIndex: number = bestRoundIndex(results);
  return results.map(
    (result: Result, index: number): GameResultRow => ({
      key: result.guessObjectId,
      position: index + 1,
      label: guessObjectName({ game, guessObjectID: result.guessObjectId }),
      detail: formatRoundDistance(result.distance),
      score: result.points,
      highlighted: index === bestIndex,
    }),
  );
}

function createRankingRows({
  playerTotals,
  localPlayerID,
}: {
  playerTotals: PlayerTotal[];
  localPlayerID: PlayerId;
}): GameResultRow[] {
  return playerTotals.map(
    ({ playerID, totalPoints }: PlayerTotal, index: number): GameResultRow => ({
      key: playerID,
      position: index + 1,
      label: playerID,
      score: totalPoints,
      highlighted: playerID === localPlayerID,
    }),
  );
}

export function createGameResults({
  game,
  localPlayerID,
}: {
  game: Game;
  localPlayerID: PlayerId;
}): GameResults {
  const localResults: ApiPlayerResults | undefined =
    game.state.results[localPlayerID];
  const playerTotals: PlayerTotal[] = Object.entries(game.state.results)
    .map(
      ([playerID, results]: [string, ApiPlayerResults]): PlayerTotal => ({
        playerID: PlayerIdSchema.parse(playerID),
        totalPoints: calculateTotalPoints(results),
      }),
    )
    .sort(
      (first: PlayerTotal, second: PlayerTotal): number =>
        second.totalPoints - first.totalPoints,
    );

  return {
    totalPoints: localResults ? calculateTotalPoints(localResults) : 0,
    ranking:
      playerTotals.length > 1
        ? createRankingRows({ playerTotals, localPlayerID })
        : undefined,
    rounds: localResults
      ? createRoundRows({ game, results: localResults.results })
      : [],
  };
}
