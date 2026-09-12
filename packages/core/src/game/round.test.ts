import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGame,
  buildGameState,
  GuessObjectIdSchema,
  PlayerIdSchema,
} from '@cityborn/api';
import { aggregateGameResults } from './round';

test('aggregateGameResults preserves results when no round is active', () => {
  const playerId = PlayerIdSchema.parse('alice');
  const results = {
    [playerId]: {
      results: [
        {
          guessObjectId: GuessObjectIdSchema.parse('guess-object-1'),
          distance: 12,
          points: 900,
        },
      ],
    },
  };
  const game = buildGame({
    state: buildGameState({ results }),
  });

  assert.strictEqual(aggregateGameResults(game), game.state.results);
  assert.deepEqual(game.state.results, results);
});
