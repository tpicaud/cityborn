import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGameConfig, buildPlayer, SessionMode } from '@cityborn/api';
import { toGameRecordViewModel } from './game-record-view-model';

const record = {
  id: 'record-1',
  mode: SessionMode.MULTI,
  gameConfig: buildGameConfig(),
  players: [buildPlayer('alice'), buildPlayer('bob')],
  guessObjectsIds: ['object-1'],
  results: {
    alice: {
      results: [{ guessObjectId: 'object-1', distance: 12, points: 7 }],
    },
    bob: { results: [{ guessObjectId: 'object-1', distance: 30, points: 3 }] },
  },
  createdAt: '2026-01-15T10:30:00.000Z',
};

describe('toGameRecordViewModel', () => {
  it('totals the points of the given player', () => {
    assert.equal(toGameRecordViewModel(record, 'alice').totalPoints, 7);
  });

  it('totals zero when the player did not take part', () => {
    assert.equal(toGameRecordViewModel(record, 'carol').totalPoints, 0);
  });

  it('exposes every player score', () => {
    assert.deepEqual(toGameRecordViewModel(record, 'alice').scores, [
      { username: 'alice', totalPoints: 7 },
      { username: 'bob', totalPoints: 3 },
    ]);
  });

  it('lists the players of the record', () => {
    assert.deepEqual(toGameRecordViewModel(record, 'alice').playerUsernames, [
      'alice',
      'bob',
    ]);
  });
});
