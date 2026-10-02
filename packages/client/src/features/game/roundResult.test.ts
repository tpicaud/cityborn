import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Game, Guess, PlayerId } from '@cityborn/api';
import {
  buildFullGuessObject,
  defaultGuess,
  GameIdSchema,
  GameStatus,
  GuessObjectIdSchema,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import {
  canSubmitGuess,
  createRoundResult,
  type RoundResult,
} from './roundResult';
import { formatTimeLeft } from './roundTimer';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
const guessObjectID = GuessObjectIdSchema.parse('object-1');

const missedGuess: Guess = {
  coordinates: { lat: 45, lng: 4 },
  distance: 391.42,
  points: 676,
  win: false,
};

function buildGame(
  status: RoundStatus,
  playersGuesses: Record<PlayerId, Guess> | undefined,
): Game {
  return {
    id: GameIdSchema.parse('game-1'),
    config: { categories: [], timer: 25, nbOfObjects: 1 },
    status: GameStatus.IN_GAME,
    state: {
      guessObjectsIds: [guessObjectID],
      guessObjects: [buildFullGuessObject({ id: guessObjectID })],
      results: {},
      currentRound: { status, guessObjectId: guessObjectID, playersGuesses },
    },
  };
}

test('the round result separates the local outcome from the other players points', () => {
  const game: Game = buildGame(RoundStatus.SHOWING_RESULTS, {
    [localPlayerID]: missedGuess,
    [otherPlayerID]: { ...missedGuess, points: 900 },
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

test('a guess sent when the timer ends is a timed out outcome', () => {
  const game: Game = buildGame(RoundStatus.SHOWING_RESULTS, {
    [localPlayerID]: defaultGuess,
  });

  assert.deepEqual(createRoundResult(game, localPlayerID)?.localOutcome, {
    kind: 'timedOut',
  });
});

test('there is no round result while players are guessing', () => {
  const game: Game = buildGame(RoundStatus.GUESSING, {
    [localPlayerID]: missedGuess,
  });

  assert.equal(createRoundResult(game, localPlayerID), undefined);
});

test('a guess can be submitted once per round with a pre guess', () => {
  const guessingGame: Game = buildGame(RoundStatus.GUESSING, undefined);
  const guessedGame: Game = buildGame(RoundStatus.GUESSING, {
    [localPlayerID]: missedGuess,
  });

  assert.equal(canSubmitGuess(guessingGame, localPlayerID, missedGuess), true);
  assert.equal(canSubmitGuess(guessingGame, localPlayerID, undefined), false);
  assert.equal(canSubmitGuess(guessedGame, localPlayerID, missedGuess), false);
});

test('the time left is rounded up to the started second', () => {
  assert.equal(formatTimeLeft(25), '0:25');
  assert.equal(formatTimeLeft(24.2), '0:25');
  assert.equal(formatTimeLeft(0.4), '0:01');
  assert.equal(formatTimeLeft(65), '1:05');
});
