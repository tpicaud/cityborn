import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSession } from '../builders/session.builder';

test('a multiplayer session can explicitly have no host', () => {
  const session = buildSession({ hostID: '' });

  assert.equal(session.hostID, '');
});
