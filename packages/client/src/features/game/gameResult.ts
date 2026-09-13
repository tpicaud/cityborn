import type {
  PlayerResults as ApiPlayerResults,
  Game,
  GuessObjectId,
  PlayerId,
} from '@cityborn/api';
import { PlayerIdSchema } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';

export interface GameRoundResult {
  guessObjectID: GuessObjectId;
  guessObjectName: string;
  distanceInKm: number | undefined;
  points: number;
}

export interface GamePlayerResults {
  playerID: PlayerId;
  totalPoints: number;
  roundResults: GameRoundResult[];
}

export interface GameResults {
  localPlayerResults: GamePlayerResults | undefined;
  playersResults: GamePlayerResults[];
  isMultiplayer: boolean;
}

function getGuessObjectName(game: Game, guessObjectID: GuessObjectId): string {
  return (
    game.state.guessObjects?.find(({ id }) => id === guessObjectID)?.name ??
    guessObjectID
  );
}

function createGamePlayerResults(
  game: Game,
  playerID: PlayerId,
  results: ApiPlayerResults,
): GamePlayerResults {
  return {
    playerID,
    totalPoints: calculateTotalPoints(results),
    roundResults: results.results.map((result) => ({
      guessObjectID: result.guessObjectId,
      guessObjectName: getGuessObjectName(game, result.guessObjectId),
      distanceInKm: result.distance === -1 ? undefined : result.distance,
      points: result.points,
    })),
  };
}

export function createGameResults(
  game: Game,
  localPlayerID: PlayerId,
): GameResults {
  const playersResults = Object.keys(game.state.results)
    .map((playerID) => PlayerIdSchema.parse(playerID))
    .map((playerID) =>
      createGamePlayerResults(game, playerID, game.state.results[playerID]),
    )
    .sort((first, second) => second.totalPoints - first.totalPoints);

  return {
    localPlayerResults: playersResults.find(
      ({ playerID }) => playerID === localPlayerID,
    ),
    playersResults,
    isMultiplayer: playersResults.length > 1,
  };
}
