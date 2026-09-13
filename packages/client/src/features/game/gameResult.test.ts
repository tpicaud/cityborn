import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Game } from '@cityborn/api';
import {
  buildFullGuessObject,
  GameIdSchema,
  GameStatus,
  GuessObjectIdSchema,
  PlayerIdSchema,
} from '@cityborn/api';
import { createGameResults } from './gameResult';

const localPlayerID = PlayerIdSchema.parse('local-player');
const otherPlayerID = PlayerIdSchema.parse('other-player');
const firstObjectID = GuessObjectIdSchema.parse('object-1');
const secondObjectID = GuessObjectIdSchema.parse('object-2');

const game: Game = {
  id: GameIdSchema.parse('game-1'),
  config: { categories: [], timer: 25, nbOfObjects: 2 },
  status: GameStatus.IN_RESULTS,
  state: {
    guessObjectsIds: [firstObjectID, secondObjectID],
    guessObjects: [
      buildFullGuessObject({ id: firstObjectID, name: 'Ada Lovelace' }),
    ],
    results: {
      [localPlayerID]: {
        results: [
          { guessObjectId: firstObjectID, distance: 12.5, points: 800 },
          { guessObjectId: secondObjectID, distance: -1, points: 0 },
        ],
      },
      [otherPlayerID]: {
        results: [
          { guessObjectId: firstObjectID, distance: 5, points: 950 },
          { guessObjectId: secondObjectID, distance: 10, points: 900 },
        ],
      },
    },
  },
};

test('createGameResults classe et enrichit les résultats', () => {
  const results = createGameResults(game, localPlayerID);

  assert.equal(results.isMultiplayer, true);
  assert.equal(results.playersResults[0].playerID, otherPlayerID);
  assert.equal(results.playersResults[0].totalPoints, 1850);
  assert.equal(results.localPlayerResults?.totalPoints, 800);
  assert.deepEqual(results.localPlayerResults?.roundResults, [
    {
      guessObjectID: firstObjectID,
      guessObjectName: 'Ada Lovelace',
      distanceInKm: 12.5,
      points: 800,
    },
    {
      guessObjectID: secondObjectID,
      guessObjectName: secondObjectID,
      distanceInKm: undefined,
      points: 0,
    },
  ]);
});
