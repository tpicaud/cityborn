import type {
  Coord,
  FullGuessObject,
  Game,
  Guess,
  GuessObjectId,
  PlayerId,
  RoundGuessObject,
  WorldLocation,
} from '@cityborn/api';
import { RoundStatus } from '@cityborn/api';

export type RoundGuessOutcome =
  | { kind: 'timedOut' }
  | { kind: 'found' }
  | { kind: 'missed'; distanceInKm: number };

export type RoundResult = {
  guessObject: FullGuessObject;
  localPoints: number;
  localOutcome: RoundGuessOutcome;
};

export type GuessProgress = {
  hasLocalGuess: boolean;
  guessedPlayerCount: number;
  playerCount: number;
};

export function currentGuessObject(game: Game): RoundGuessObject | undefined {
  const guessObjectID: GuessObjectId | undefined =
    game.state.currentRound?.guessObjectId;
  return game.state.roundGuessObjects?.find(({ id }) => id === guessObjectID);
}

export function currentRevealedGuessObject(
  game: Game,
): FullGuessObject | undefined {
  const guessObject: RoundGuessObject | undefined = currentGuessObject(game);
  const worldLocation: WorldLocation | undefined = guessObject?.world_location;
  return guessObject && worldLocation
    ? { ...guessObject, world_location: worldLocation }
    : undefined;
}

export function canSubmitGuess(
  game: Game,
  localPlayerID: PlayerId,
  preGuess: Coord | undefined,
): boolean {
  return (
    preGuess !== undefined &&
    game.state.currentRound?.status === RoundStatus.GUESSING &&
    !createGuessProgress(game, localPlayerID).hasLocalGuess
  );
}

export function createGuessProgress(
  game: Game,
  localPlayerID: PlayerId,
): GuessProgress {
  const playersGuesses: Record<PlayerId, Guess> =
    game.state.currentRound?.playersGuesses ?? {};

  return {
    hasLocalGuess: playersGuesses[localPlayerID] !== undefined,
    guessedPlayerCount: Object.keys(playersGuesses).length,
    playerCount: Object.keys(game.state.results).length,
  };
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
  const guessObject: FullGuessObject | undefined =
    currentRevealedGuessObject(game);
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
  };
}

const distanceInKmFormat: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function formatRoundOutcome(outcome: RoundGuessOutcome): string {
  if (outcome.kind === 'timedOut') return "Tu n'as pas deviné à temps !";
  if (outcome.kind === 'found') return 'Bien joué ! Tu as deviné !';
  return `${formatDistanceInKm(outcome.distanceInKm)} km du lieu`;
}

export function formatDistanceInKm(distanceInKm: number): string {
  return distanceInKmFormat.format(Math.max(distanceInKm, 1));
}
