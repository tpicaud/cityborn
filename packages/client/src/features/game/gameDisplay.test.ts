import assert from 'node:assert/strict';
import {
  buildGame,
  buildGameConfig,
  buildGameState,
  buildRound,
  type Game,
  GameStatus,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import { describe, it } from 'vitest';
import { createGameDisplay, type GameDisplay } from './gameDisplay';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const firstObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-1');
const secondObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-2');

const gameShowingLastRoundResults: Game = buildGame({
  config: buildGameConfig({ nbOfObjects: 2 }),
  status: GameStatus.IN_RESULTS,
  state: buildGameState({
    guessObjectsIds: [firstObjectID, secondObjectID],
    currentRound: buildRound({
      status: RoundStatus.SHOWING_RESULTS,
      guessObjectId: secondObjectID,
    }),
  }),
});

describe('createGameDisplay', () => {
  it('exposes the game state and progress', () => {
    const display: GameDisplay = createGameDisplay(
      gameShowingLastRoundResults,
      localPlayerID,
    );

    assert.deepEqual(display, {
      state: 'playing',
      localPlayerID,
      showNextRound: true,
      showResults: true,
      showOptions: false,
      roundNumber: 2,
      roundCount: 2,
    });
  });

  it('offers the options while a round is played', () => {
    const playedGame: Game = {
      ...gameShowingLastRoundResults,
      status: GameStatus.IN_GAME,
    };

    const display: GameDisplay = createGameDisplay(playedGame, localPlayerID);

    assert.equal(display.showOptions, true);
  });

  it('reports a starting game as loading', () => {
    const startingGame: Game = {
      ...gameShowingLastRoundResults,
      status: GameStatus.STARTING,
    };

    const display: GameDisplay = createGameDisplay(startingGame, localPlayerID);

    assert.equal(display.state, 'loading');
  });

  it('reports a game without local player as unavailable', () => {
    const display: GameDisplay = createGameDisplay(
      gameShowingLastRoundResults,
      undefined,
    );

    assert.equal(display.state, 'unavailable');
  });
});
