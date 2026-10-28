import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildGuess,
  buildRound,
  defaultGuess,
  type FullGuessObject,
  type Game,
  type PlayerId,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import { hideGuessingRoundGuesses, revealGuessObject } from './round';

const alice: PlayerId = PlayerIdSchema.parse('alice');
const bob: PlayerId = PlayerIdSchema.parse('bob');

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
  it('appends the guess object to the revealed guess objects', () => {
    const playedGuessObject: FullGuessObject = buildFullGuessObject({
      id: 'object-1',
    });
    const currentGuessObject: FullGuessObject = buildFullGuessObject({
      id: 'object-2',
    });
    const game: Game = buildGame({
      state: buildGameState({ revealedGuessObjects: [playedGuessObject] }),
    });

    const revealedGame: Game = revealGuessObject({
      game,
      guessObject: currentGuessObject,
    });

    assert.deepEqual(revealedGame.state.revealedGuessObjects, [
      playedGuessObject,
      currentGuessObject,
    ]);
  });
});
