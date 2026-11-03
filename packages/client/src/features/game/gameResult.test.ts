import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildGame,
  buildGameState,
  buildRoundGuessObject,
  type Game,
  GameStatus,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
} from '@cityborn/api';
import { createGameResults, type GameResults } from './gameResult';

const localPlayerID: PlayerId = PlayerIdSchema.parse('local-player');
const otherPlayerID: PlayerId = PlayerIdSchema.parse('other-player');
const firstObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-1');
const secondObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-2');

describe('createGameResults', () => {
  it('ranks and enriches the results', () => {
    const game: Game = buildGame({
      status: GameStatus.IN_RESULTS,
      state: buildGameState({
        guessObjectsIds: [firstObjectID, secondObjectID],
        roundGuessObjects: [
          buildRoundGuessObject({
            id: firstObjectID,
            name: 'Ada Lovelace',
          }),
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
      }),
    });

    const results: GameResults = createGameResults(game, localPlayerID);

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
        guessObjectName: 'object-2',
        distanceInKm: undefined,
        points: 0,
      },
    ]);
  });
});
