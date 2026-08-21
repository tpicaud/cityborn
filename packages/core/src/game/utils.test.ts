import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FullGuessObject, Game } from '@cityborn/api';
import {
  calculatePoints,
  calculateTotalPoints,
  reconcileGuessObjects,
} from './utils';

test('calculatePoints returns 1000 for a perfect guess', () => {
  assert.equal(calculatePoints(0), 1000);
});

test('calculatePoints decreases with distance and never goes negative', () => {
  assert.equal(calculatePoints(20000), 0);
  assert.ok(calculatePoints(1000) < calculatePoints(100));
});

test('calculateTotalPoints sums every round result', () => {
  const total = calculateTotalPoints({
    results: [
      { guessObjectId: 'obj-1', distance: 10, points: 900 },
      { guessObjectId: 'obj-2', distance: 20, points: 800 },
    ],
  });

  assert.equal(total, 1700);
});

const guessObjects = [{ id: 'obj-1' } as FullGuessObject];

function gameWith(overrides: Partial<Game['state']>): Game {
  return {
    id: 'game-1',
    config: { categories: [], timer: 25, nbOfObjects: 1 },
    status: 'IN_GAME' as Game['status'],
    state: {
      guessObjectsIds: ['obj-1'],
      results: {},
      ...overrides,
    },
  };
}

test('reconcileGuessObjects keeps the locally known guessObjects when the incoming game has none', () => {
  const local = gameWith({ guessObjects });
  const incoming = gameWith({});

  const result = reconcileGuessObjects(local, incoming);

  assert.equal(result?.state.guessObjects, guessObjects);
});

test('reconcileGuessObjects prefers the incoming guessObjects when the server does send them', () => {
  const local = gameWith({ guessObjects });
  const freshGuessObjects = [{ id: 'obj-2' } as FullGuessObject];
  const incoming = gameWith({ guessObjects: freshGuessObjects });

  const result = reconcileGuessObjects(local, incoming);

  assert.equal(result?.state.guessObjects, freshGuessObjects);
});

test('reconcileGuessObjects returns undefined when there is no incoming game', () => {
  const local = gameWith({ guessObjects });

  const result = reconcileGuessObjects(local, undefined);

  assert.equal(result, undefined);
});
