import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildGuess,
  buildRound,
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
  createRoundResult,
  type RoundResult,
} from './roundResult';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
const guessObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-1');

const missedGuess: Guess = buildGuess({ distance: 391.42, points: 676 });

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
      guessObjects: [buildFullGuessObject({ id: guessObjectID })],
      currentRound: buildRound({
        status,
        guessObjectId: guessObjectID,
        playersGuesses,
      }),
    }),
  });
}

describe('createRoundResult', () => {
  it('separates the local outcome from the other players points', () => {
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
    assert.deepEqual(roundResult?.otherPlayersPoints, [
      { playerID: otherPlayerID, points: 900 },
    ]);
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

    const canSubmit: boolean = canSubmitGuess(
      game,
      localPlayerID,
      missedGuess.coordinates,
    );

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

    const canSubmit: boolean = canSubmitGuess(
      game,
      localPlayerID,
      missedGuess.coordinates,
    );

    assert.equal(canSubmit, false);
  });
});
