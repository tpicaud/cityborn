import type { FullGuessObject, Game, Guess, PlayerId } from '@cityborn/api';
import { PlayerIdSchema, RoundStatus } from '@cityborn/api';

export type RoundGuessOutcome =
  | { kind: 'timedOut' }
  | { kind: 'found' }
  | { kind: 'missed'; distanceInKm: number };

export type PlayerRoundPoints = {
  playerID: PlayerId;
  points: number;
};

export type RoundResult = {
  guessObject: FullGuessObject;
  localPoints: number;
  localOutcome: RoundGuessOutcome;
  otherPlayersPoints: PlayerRoundPoints[];
};

export function currentGuessObject(game: Game): FullGuessObject | undefined {
  const guessObjectID = game.state.currentRound?.guessObjectId;
  return game.state.guessObjects?.find(({ id }) => id === guessObjectID);
}

export function canSubmitGuess(
  game: Game,
  localPlayerID: PlayerId,
  preGuess: Guess | undefined,
): boolean {
  const currentRound = game.state.currentRound;
  return (
    preGuess !== undefined &&
    currentRound?.status === RoundStatus.GUESSING &&
    currentRound.playersGuesses?.[localPlayerID] === undefined
  );
}

function roundGuessOutcome(guess: Guess): RoundGuessOutcome {
  if (guess.distance === -1) return { kind: 'timedOut' };
  if (guess.distance === 0) return { kind: 'found' };
  return { kind: 'missed', distanceInKm: guess.distance };
}

export function createRoundResult(
  game: Game,
  localPlayerID: PlayerId,
): RoundResult | undefined {
  const currentRound = game.state.currentRound;
  const guessObject: FullGuessObject | undefined = currentGuessObject(game);
  const playersGuesses = currentRound?.playersGuesses;
  const localGuess: Guess | undefined = playersGuesses?.[localPlayerID];
  if (
    currentRound?.status !== RoundStatus.SHOWING_RESULTS ||
    !guessObject ||
    !playersGuesses ||
    !localGuess
  ) {
    return undefined;
  }

  return {
    guessObject,
    localPoints: localGuess.points,
    localOutcome: roundGuessOutcome(localGuess),
    otherPlayersPoints: Object.entries(playersGuesses)
      .map(([playerID, guess]) => ({
        playerID: PlayerIdSchema.parse(playerID),
        points: guess.points,
      }))
      .filter(({ playerID }) => playerID !== localPlayerID),
  };
}

export function formatDistanceInKm(distanceInKm: number): string {
  return distanceInKm.toFixed(2);
}
