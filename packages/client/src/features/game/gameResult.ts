import type {
  Game,
  GuessObjectId,
  PlayerId,
  PlayerResults,
} from '@cityborn/api';
import { PlayerIdSchema } from '@cityborn/api';
import { calculateTotalPoints } from '@cityborn/core';

export interface RoundResultViewModel {
  guessObjectID: GuessObjectId;
  guessObjectName: string;
  distanceInKm: number | undefined;
  points: number;
}

export interface PlayerResultsViewModel {
  playerID: PlayerId;
  totalPoints: number;
  roundResults: RoundResultViewModel[];
}

export interface GameResultsViewModel {
  localPlayerResults: PlayerResultsViewModel | undefined;
  playersResults: PlayerResultsViewModel[];
  isMultiplayer: boolean;
}

function getGuessObjectName(game: Game, guessObjectID: GuessObjectId): string {
  return (
    game.state.guessObjects?.find(({ id }) => id === guessObjectID)?.name ??
    guessObjectID
  );
}

function createPlayerResultsViewModel(
  game: Game,
  playerID: PlayerId,
  results: PlayerResults,
): PlayerResultsViewModel {
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

export function createGameResultsViewModel(
  game: Game,
  localPlayerID: PlayerId,
): GameResultsViewModel {
  const playersResults = Object.keys(game.state.results)
    .map((playerID) => PlayerIdSchema.parse(playerID))
    .map((playerID) =>
      createPlayerResultsViewModel(
        game,
        playerID,
        game.state.results[playerID],
      ),
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
