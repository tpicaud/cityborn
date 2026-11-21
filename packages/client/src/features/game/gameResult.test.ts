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
const thirdObjectID: GuessObjectId = GuessObjectIdSchema.parse('object-3');

describe('createGameResults', () => {
  it('details the local rounds and highlights the first best one', () => {
    const game: Game = buildGame({
      status: GameStatus.IN_RESULTS,
      state: buildGameState({
        guessObjectsIds: [firstObjectID, secondObjectID, thirdObjectID],
        roundGuessObjects: [
          buildRoundGuessObject({ id: firstObjectID, name: 'Ada Lovelace' }),
        ],
        results: {
          [localPlayerID]: {
            results: [
              { guessObjectId: firstObjectID, distance: 12.5, points: 800 },
              { guessObjectId: secondObjectID, distance: -1, points: 0 },
              { guessObjectId: thirdObjectID, distance: 1902.2, points: 800 },
            ],
          },
        },
      }),
    });

    const results: GameResults = createGameResults({ game, localPlayerID });

    assert.deepEqual(results, {
      totalPoints: 1600,
      ranking: undefined,
      rounds: [
        {
          key: firstObjectID,
          position: 1,
          label: 'Ada Lovelace',
          detail: '13 km',
          score: 800,
          highlighted: true,
        },
        {
          key: secondObjectID,
          position: 2,
          label: 'object-2',
          detail: 'Trop tard',
          score: 0,
          highlighted: false,
        },
        {
          key: thirdObjectID,
          position: 3,
          label: 'object-3',
          detail: '1 902 km',
          score: 800,
          highlighted: false,
        },
      ],
    });
  });

  it('highlights no round when every round scores zero', () => {
    const game: Game = buildGame({
      status: GameStatus.IN_RESULTS,
      state: buildGameState({
        guessObjectsIds: [firstObjectID],
        results: {
          [localPlayerID]: {
            results: [
              { guessObjectId: firstObjectID, distance: -1, points: 0 },
            ],
          },
        },
      }),
    });

    const results: GameResults = createGameResults({ game, localPlayerID });

    assert.equal(results.rounds[0].highlighted, false);
  });

  it('ranks the players of a multiplayer game and highlights the local one', () => {
    const game: Game = buildGame({
      status: GameStatus.IN_RESULTS,
      state: buildGameState({
        guessObjectsIds: [firstObjectID, secondObjectID],
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

    const results: GameResults = createGameResults({ game, localPlayerID });

    assert.equal(results.totalPoints, 800);
    assert.deepEqual(results.ranking, [
      {
        key: otherPlayerID,
        position: 1,
        label: 'other-player',
        score: 1850,
        highlighted: false,
      },
      {
        key: localPlayerID,
        position: 2,
        label: 'local-player',
        score: 800,
        highlighted: true,
      },
    ]);
  });

  it('scores zero without results for the local player', () => {
    const game: Game = buildGame({
      status: GameStatus.IN_RESULTS,
      state: buildGameState({
        guessObjectsIds: [firstObjectID],
        results: {
          [otherPlayerID]: {
            results: [
              { guessObjectId: firstObjectID, distance: 5, points: 950 },
            ],
          },
        },
      }),
    });

    const results: GameResults = createGameResults({ game, localPlayerID });

    assert.equal(results.totalPoints, 0);
    assert.deepEqual(results.rounds, []);
  });
});
