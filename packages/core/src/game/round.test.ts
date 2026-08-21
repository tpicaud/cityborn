import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultGuess,
  type Game,
  GameStatus,
  RoundStatus,
} from '@cityborn/api';
import {
  aggregateGameResults,
  applyGuess,
  beginGame,
  resolveNextRound,
} from './round';

function baseGame(overrides: Partial<Game['state']> = {}): Game {
  return {
    id: 'game-1',
    config: { categories: [], timer: 25, nbOfObjects: 2 },
    status: GameStatus.IN_GAME,
    state: {
      guessObjectsIds: ['obj-1', 'obj-2'],
      results: { alice: { results: [] }, bob: { results: [] } },
      currentRound: {
        status: RoundStatus.GUESSING,
        guessObjectId: 'obj-1',
        playersGuesses: {},
      },
      ...overrides,
    },
  };
}

const guess = {
  coordinates: { lat: 1, lng: 1 },
  distance: 10,
  points: 900,
  win: false,
};

test('beginGame switches the game to IN_GAME and opens the first round', () => {
  const game = baseGame({ currentRound: undefined });

  const result = beginGame(game);

  assert.equal(result.status, GameStatus.IN_GAME);
  assert.deepEqual(result.state.currentRound, {
    status: RoundStatus.GUESSING,
    guessObjectId: 'obj-1',
    playersGuesses: {},
  });
});

test('applyGuess records the guess without marking the round done when other connected players still owe a guess', () => {
  const game = baseGame();
  const result = applyGuess(game, 'alice', guess, ['alice', 'bob']);

  assert.deepEqual(result.state.currentRound?.playersGuesses, { alice: guess });
  assert.equal(result.state.currentRound?.status, RoundStatus.GUESSING);
});

test('applyGuess merges into existing guesses instead of overwriting other players', () => {
  const game = baseGame({
    currentRound: {
      status: RoundStatus.GUESSING,
      guessObjectId: 'obj-1',
      playersGuesses: { bob: { ...guess, distance: 5 } },
    },
  });

  const result = applyGuess(game, 'alice', guess, ['alice', 'bob']);

  assert.deepEqual(result.state.currentRound?.playersGuesses, {
    bob: { ...guess, distance: 5 },
    alice: guess,
  });
  assert.equal(result.state.currentRound?.status, RoundStatus.SHOWING_RESULTS);
});

test('applyGuess fills disconnected players with defaultGuess once every connected player has guessed', () => {
  const game = baseGame({
    results: { alice: { results: [] }, bob: { results: [] } },
    currentRound: {
      status: RoundStatus.GUESSING,
      guessObjectId: 'obj-1',
      playersGuesses: {},
    },
  });

  const result = applyGuess(game, 'alice', guess, ['alice']);

  assert.deepEqual(result.state.currentRound?.playersGuesses, {
    alice: guess,
    bob: defaultGuess,
  });
  assert.equal(result.state.currentRound?.status, RoundStatus.SHOWING_RESULTS);
});

test('applyGuess is a no-op when the player already guessed', () => {
  const game = baseGame({
    currentRound: {
      status: RoundStatus.GUESSING,
      guessObjectId: 'obj-1',
      playersGuesses: { alice: guess },
    },
  });

  const result = applyGuess(game, 'alice', { ...guess, distance: 0 }, [
    'alice',
    'bob',
  ]);

  assert.equal(result, game);
});

test('applyGuess is a no-op when there is no active round', () => {
  const game = baseGame({ currentRound: undefined });

  const result = applyGuess(game, 'alice', guess, ['alice']);

  assert.equal(result, game);
});

test('aggregateGameResults records a -1/0 result for players who never guessed this round', () => {
  const game = baseGame({
    guessObjectsIds: ['obj-1'],
    currentRound: {
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: 'obj-1',
      playersGuesses: { alice: guess },
    },
  });

  const results = aggregateGameResults(game);

  assert.deepEqual(results.alice.results, [
    { guessObjectId: 'obj-1', distance: 10, points: 900 },
  ]);
  assert.deepEqual(results.bob.results, [
    { guessObjectId: 'obj-1', distance: -1, points: 0 },
  ]);
});

test('aggregateGameResults appends to existing results instead of replacing them', () => {
  const game = baseGame({
    results: {
      alice: {
        results: [{ guessObjectId: 'obj-1', distance: 5, points: 950 }],
      },
    },
    currentRound: {
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: 'obj-2',
      playersGuesses: { alice: { ...guess, distance: 20, points: 800 } },
    },
  });

  const results = aggregateGameResults(game);

  assert.deepEqual(results.alice.results, [
    { guessObjectId: 'obj-1', distance: 5, points: 950 },
    { guessObjectId: 'obj-2', distance: 20, points: 800 },
  ]);
});

test('resolveNextRound aggregates the finished round into results and advances to the next guess object', () => {
  const game = baseGame({
    results: { alice: { results: [] } },
    currentRound: {
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: 'obj-1',
      playersGuesses: { alice: guess },
    },
  });

  const { game: nextGame, isGameOver } = resolveNextRound(game);

  assert.equal(isGameOver, false);
  assert.deepEqual(nextGame.state.results.alice.results, [
    { guessObjectId: 'obj-1', distance: 10, points: 900 },
  ]);
  assert.deepEqual(nextGame.state.currentRound, {
    status: RoundStatus.GUESSING,
    guessObjectId: 'obj-2',
    playersGuesses: {},
  });
});

test('resolveNextRound switches the game to IN_RESULTS after the last guess object', () => {
  const game = baseGame({
    results: { alice: { results: [] } },
    currentRound: {
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: 'obj-2',
      playersGuesses: { alice: guess },
    },
  });

  const { game: nextGame, isGameOver } = resolveNextRound(game);

  assert.equal(isGameOver, true);
  assert.equal(nextGame.status, GameStatus.IN_RESULTS);
  assert.deepEqual(nextGame.state.results.alice.results, [
    { guessObjectId: 'obj-2', distance: 10, points: 900 },
  ]);
});
