import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildGuess,
  buildRound,
  buildRoundGuessObject,
  defaultGuess,
  type FullGuessObject,
  type Game,
  type PlayerId,
  PlayerIdSchema,
  type RoundGuessObject,
  RoundStatus,
} from '@cityborn/api';
import {
  hideGuessingRoundGuesses,
  playerScore,
  removePlayer,
  resolveNextRound,
  revealGuessObject,
  roundGuessObjectIds,
} from './round';

const alice: PlayerId = PlayerIdSchema.parse('alice');
const bob: PlayerId = PlayerIdSchema.parse('bob');
const carol: PlayerId = PlayerIdSchema.parse('carol');

describe('hideGuessingRoundGuesses', () => {
  it('replaces each guess of a guessing round with the default guess', () => {
    const game: Game = buildGame({
      state: buildGameState({
        currentRound: buildRound({
          status: RoundStatus.GUESSING,
          playersGuesses: { [alice]: buildGuess({ points: 950 }) },
        }),
      }),
    });

    const hiddenGame: Game = hideGuessingRoundGuesses(game);

    assert.deepEqual(hiddenGame.state.currentRound?.playersGuesses, {
      [alice]: defaultGuess,
    });
  });

  it('keeps the guesses of a round showing its results', () => {
    const game: Game = buildGame({
      state: buildGameState({
        currentRound: buildRound({
          status: RoundStatus.SHOWING_RESULTS,
          playersGuesses: {
            [alice]: buildGuess({ points: 950 }),
            [bob]: defaultGuess,
          },
        }),
      }),
    });

    const hiddenGame: Game = hideGuessingRoundGuesses(game);

    assert.deepEqual(hiddenGame, game);
  });
});

describe('revealGuessObject', () => {
  it('adds the location to the guess object of the round only', () => {
    const currentGuessObject: FullGuessObject = buildFullGuessObject({
      id: 'object-1',
    });
    const nextGuessObject: RoundGuessObject = buildRoundGuessObject({
      id: 'object-2',
    });
    const game: Game = buildGame({
      state: buildGameState({
        roundGuessObjects: [
          buildRoundGuessObject({ id: 'object-1' }),
          nextGuessObject,
        ],
      }),
    });

    const revealedGame: Game = revealGuessObject({
      game,
      guessObject: currentGuessObject,
    });

    assert.deepEqual(revealedGame.state.roundGuessObjects, [
      currentGuessObject,
      nextGuessObject,
    ]);
  });
});

describe('resolveNextRound', () => {
  it('hides the location of the played guess object in the next round', () => {
    const game: Game = buildGame({
      state: buildGameState({
        roundGuessObjects: [
          buildFullGuessObject({ id: 'object-1' }),
          buildRoundGuessObject({ id: 'object-2' }),
        ],
        currentRound: buildRound({
          status: RoundStatus.SHOWING_RESULTS,
          guessObjectId: 'object-1',
        }),
      }),
    });

    const { game: nextRoundGame }: { game: Game } = resolveNextRound(game);

    assert.deepEqual(nextRoundGame.state.roundGuessObjects, [
      buildRoundGuessObject({ id: 'object-1' }),
      buildRoundGuessObject({ id: 'object-2' }),
    ]);
  });
});

describe('roundGuessObjectIds', () => {
  it('reads the round order from the round guess objects', () => {
    const game: Game = buildGame({
      state: buildGameState({
        guessObjectsIds: ['object-1', 'object-2'],
        roundGuessObjects: [buildRoundGuessObject({ id: 'object-2' })],
      }),
    });

    assert.deepEqual(roundGuessObjectIds(game), ['object-2']);
  });

  it('falls back to the guess object ids of a game started before deploy', () => {
    const game: Game = buildGame({
      state: buildGameState({ guessObjectsIds: ['object-1', 'object-2'] }),
    });

    assert.deepEqual(roundGuessObjectIds(game), ['object-1', 'object-2']);
  });
});

describe('removePlayer', () => {
  it('removes the results and the guess of the player', () => {
    const game: Game = buildGame({
      state: buildGameState({
        results: {
          [alice]: { results: [] },
          [bob]: { results: [] },
          [carol]: { results: [] },
        },
        currentRound: buildRound({
          status: RoundStatus.GUESSING,
          playersGuesses: { [alice]: buildGuess(), [bob]: buildGuess() },
        }),
      }),
    });

    const remainingGame: Game = removePlayer({
      game,
      playerID: alice,
      connectedPlayerIDs: [bob, carol],
    });

    assert.deepEqual(remainingGame.state.results, {
      [bob]: { results: [] },
      [carol]: { results: [] },
    });
    assert.deepEqual(remainingGame.state.currentRound, {
      status: RoundStatus.GUESSING,
      guessObjectId: 'guess-object-1',
      playersGuesses: { [bob]: buildGuess() },
    });
  });

  it('closes the round when every remaining connected player has guessed', () => {
    const game: Game = buildGame({
      state: buildGameState({
        results: { [alice]: { results: [] }, [bob]: { results: [] } },
        currentRound: buildRound({
          status: RoundStatus.GUESSING,
          playersGuesses: { [bob]: buildGuess() },
        }),
      }),
    });

    const remainingGame: Game = removePlayer({
      game,
      playerID: alice,
      connectedPlayerIDs: [bob],
    });

    assert.deepEqual(remainingGame.state.currentRound, {
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: 'guess-object-1',
      playersGuesses: { [bob]: buildGuess() },
    });
  });

  it('keeps the round of a game without remaining player open', () => {
    const game: Game = buildGame({
      state: buildGameState({
        results: { [alice]: { results: [] } },
        currentRound: buildRound({
          status: RoundStatus.GUESSING,
          playersGuesses: {},
        }),
      }),
    });

    const remainingGame: Game = removePlayer({
      game,
      playerID: alice,
      connectedPlayerIDs: [],
    });

    assert.deepEqual(remainingGame.state.results, {});
    assert.equal(
      remainingGame.state.currentRound?.status,
      RoundStatus.GUESSING,
    );
  });
});

describe('playerScore', () => {
  it('adds the points of the revealed round to the completed rounds', () => {
    const game: Game = buildGame({
      state: buildGameState({
        results: {
          [alice]: {
            results: [
              { guessObjectId: 'object-1', distance: 10, points: 990 },
              { guessObjectId: 'object-2', distance: 200, points: 819 },
            ],
          },
        },
        currentRound: buildRound({
          status: RoundStatus.SHOWING_RESULTS,
          playersGuesses: { [alice]: buildGuess({ points: 500 }) },
        }),
      }),
    });

    assert.equal(playerScore({ game, playerID: alice }), 2309);
  });

  it('ignores the guess of the round still being guessed', () => {
    const game: Game = buildGame({
      state: buildGameState({
        results: {
          [alice]: {
            results: [{ guessObjectId: 'object-1', distance: 10, points: 990 }],
          },
        },
        currentRound: buildRound({
          status: RoundStatus.GUESSING,
          playersGuesses: { [alice]: buildGuess({ points: 500 }) },
        }),
      }),
    });

    assert.equal(playerScore({ game, playerID: alice }), 990);
  });
});
