import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Game } from '@cityborn/api';
import {
  buildFullGuessObject,
  GameIdSchema,
  GameStatus,
  GuessObjectIdSchema,
  PlayerIdSchema,
  RoundStatus,
} from '@cityborn/api';
import { createGameResultsViewModel } from './gameResult';
import { createGameViewModel } from './gameViewModel';

const localPlayerID = PlayerIdSchema.parse('local-player');
const otherPlayerID = PlayerIdSchema.parse('other-player');
const firstObjectID = GuessObjectIdSchema.parse('object-1');
const secondObjectID = GuessObjectIdSchema.parse('object-2');

function createGame(): Game {
  return {
    id: GameIdSchema.parse('game-1'),
    config: { categories: [], timer: 25, nbOfObjects: 2 },
    status: GameStatus.IN_RESULTS,
    state: {
      guessObjectsIds: [firstObjectID, secondObjectID],
      guessObjects: [
        buildFullGuessObject({ id: firstObjectID, name: 'Ada Lovelace' }),
      ],
      currentRound: {
        status: RoundStatus.SHOWING_RESULTS,
        guessObjectId: secondObjectID,
      },
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
}

test('createGameResultsViewModel classe et enrichit les résultats', () => {
  const viewModel = createGameResultsViewModel(createGame(), localPlayerID);

  assert.equal(viewModel.isMultiplayer, true);
  assert.equal(viewModel.playersResults[0].playerID, otherPlayerID);
  assert.equal(viewModel.playersResults[0].totalPoints, 1850);
  assert.equal(viewModel.localPlayerResults?.totalPoints, 800);
  assert.deepEqual(viewModel.localPlayerResults?.roundResults, [
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

test('createGameViewModel expose l’état et la progression du jeu', () => {
  const viewModel = createGameViewModel(createGame(), localPlayerID);

  assert.deepEqual(viewModel, {
    displayState: 'playing',
    localPlayerID,
    showNextRound: true,
    showResults: true,
    roundNumber: 2,
    roundCount: 2,
  });
});

test('createGameViewModel distingue le chargement et le joueur absent', () => {
  const game = createGame();

  assert.equal(
    createGameViewModel({ ...game, status: GameStatus.STARTING }, localPlayerID)
      .displayState,
    'loading',
  );
  assert.equal(
    createGameViewModel(game, undefined).displayState,
    'unavailable',
  );
});
