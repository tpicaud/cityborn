import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Game } from '@cityborn/api';
import {
  GameIdSchema,
  GameStatus,
  GuessObjectIdSchema,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import { createGameDisplay } from './gameDisplay';

const localPlayerID = PlayerIdSchema.parse('local-player');
const firstObjectID = GuessObjectIdSchema.parse('object-1');
const secondObjectID = GuessObjectIdSchema.parse('object-2');

function createGame(): Game {
  return {
    id: GameIdSchema.parse('game-1'),
    config: { categories: [], timer: 25, nbOfObjects: 2 },
    status: GameStatus.IN_RESULTS,
    state: {
      guessObjectsIds: [firstObjectID, secondObjectID],
      results: {},
      currentRound: {
        status: RoundStatus.SHOWING_RESULTS,
        guessObjectId: secondObjectID,
      },
    },
  };
}

test('createGameDisplay expose l’état et la progression du jeu', () => {
  const display = createGameDisplay(createGame(), localPlayerID);

  assert.deepEqual(display, {
    state: 'playing',
    localPlayerID,
    showNextRound: true,
    showResults: true,
    roundNumber: 2,
    roundCount: 2,
  });
});

test('createGameDisplay distingue le chargement et le joueur absent', () => {
  const game = createGame();

  assert.equal(
    createGameDisplay({ ...game, status: GameStatus.STARTING }, localPlayerID)
      .state,
    'loading',
  );
  assert.equal(createGameDisplay(game, undefined).state, 'unavailable');
});
