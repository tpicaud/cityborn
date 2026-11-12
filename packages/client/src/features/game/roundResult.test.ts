import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildGuess,
  buildRound,
  buildRoundGuessObject,
  type Coord,
  defaultGuess,
  type Game,
  type Guess,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import {
  canSubmitGuess,
  createGuessProgress,
  createRoundResult,
  formatDistanceInKm,
  type GuessProgress,
  type RoundResult,
} from './roundResult';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
const guessObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-1');

const missedGuess: Guess = buildGuess({ distance: 391.42, points: 676 });
const preGuess: Coord = { lat: 45.76, lng: 4.83 };

function buildGameInRound({
  status,
  playersGuesses,
}: {
  status: RoundStatus;
  playersGuesses?: Record<PlayerId, Guess>;
}): Game {
  return buildGame({
    state: buildGameState({
      guessObjectsIds: [guessObjectID],
      roundGuessObjects: [buildFullGuessObject({ id: guessObjectID })],
      currentRound: buildRound({
        status,
        guessObjectId: guessObjectID,
        playersGuesses,
      }),
    }),
  });
}

describe('createRoundResult', () => {
  it('reports the local outcome and points', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
      playersGuesses: {
        [localPlayerID]: missedGuess,
        [otherPlayerID]: buildGuess({ points: 900 }),
      },
    });

    const roundResult: RoundResult | undefined = createRoundResult(
      game,
      localPlayerID,
    );

    assert.deepEqual(roundResult?.localOutcome, {
      kind: 'missed',
      distanceInKm: 391.42,
    });
    assert.equal(roundResult?.localPoints, 676);
  });

  it('reports a guess sent when the timer ends as timed out', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
      playersGuesses: { [localPlayerID]: defaultGuess },
    });

    const roundResult: RoundResult | undefined = createRoundResult(
      game,
      localPlayerID,
    );

    assert.deepEqual(roundResult?.localOutcome, { kind: 'timedOut' });
  });

  it('returns no result until the server reveals the guess object', () => {
    const roundGame: Game = buildGameInRound({
      status: RoundStatus.SHOWING_RESULTS,
      playersGuesses: { [localPlayerID]: missedGuess },
    });
    const game: Game = {
      ...roundGame,
      state: {
        ...roundGame.state,
        roundGuessObjects: [buildRoundGuessObject({ id: guessObjectID })],
      },
    };

    const roundResult: RoundResult | undefined = createRoundResult(
      game,
      localPlayerID,
    );

    assert.equal(roundResult, undefined);
  });

  it('returns no result while players are guessing', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [localPlayerID]: missedGuess },
    });

    const roundResult: RoundResult | undefined = createRoundResult(
      game,
      localPlayerID,
    );

    assert.equal(roundResult, undefined);
  });
});

describe('canSubmitGuess', () => {
  it('accepts a pre-guess during a round the player has not guessed yet', () => {
    const game: Game = buildGameInRound({ status: RoundStatus.GUESSING });

    const canSubmit: boolean = canSubmitGuess(game, localPlayerID, preGuess);

    assert.equal(canSubmit, true);
  });

  it('rejects a submission without a pre-guess', () => {
    const game: Game = buildGameInRound({ status: RoundStatus.GUESSING });

    const canSubmit: boolean = canSubmitGuess(game, localPlayerID, undefined);

    assert.equal(canSubmit, false);
  });

  it('rejects a second guess in the same round', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [localPlayerID]: missedGuess },
    });

    const canSubmit: boolean = canSubmitGuess(game, localPlayerID, preGuess);

    assert.equal(canSubmit, false);
  });
});

describe('createGuessProgress', () => {
  it('counts the players who guessed among the players of the game', () => {
    const roundGame: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [otherPlayerID]: missedGuess },
    });
    const game: Game = {
      ...roundGame,
      state: {
        ...roundGame.state,
        results: {
          [localPlayerID]: { results: [] },
          [otherPlayerID]: { results: [] },
        },
      },
    };

    const guessProgress: GuessProgress = createGuessProgress(
      game,
      localPlayerID,
    );

    assert.deepEqual(guessProgress, {
      hasLocalGuess: false,
      guessedPlayerCount: 1,
      playerCount: 2,
    });
  });

  it('reports the local guess once sent', () => {
    const game: Game = buildGameInRound({
      status: RoundStatus.GUESSING,
      playersGuesses: { [localPlayerID]: missedGuess },
    });

    const guessProgress: GuessProgress = createGuessProgress(
      game,
      localPlayerID,
    );

    assert.equal(guessProgress.hasLocalGuess, true);
  });
});

describe('formatDistanceInKm', () => {
  it('rounds to the kilometre with French digit grouping', () => {
    const formattedDistance: string = formatDistanceInKm(12345.6);

    assert.equal(formattedDistance, '12\u202f346');
  });

  it('shows at least one kilometre for a missed guess', () => {
    const formattedDistance: string = formatDistanceInKm(0.3);

    assert.equal(formattedDistance, '1');
  });
});
