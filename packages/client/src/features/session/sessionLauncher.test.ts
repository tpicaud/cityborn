import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type SessionId, SessionIdSchema } from '@cityborn/api';
import {
  multiSessionPath,
  sessionIdFromMultiSessionPath,
} from './sessionLauncher';

const sessionId: SessionId = SessionIdSchema.parse('brave-golden-lynx');

test('sessionIdFromMultiSessionPath reads the session of a multi session path', () => {
  assert.equal(
    sessionIdFromMultiSessionPath(multiSessionPath(sessionId)),
    sessionId,
  );
});

test('sessionIdFromMultiSessionPath rejects a path without session', () => {
  assert.equal(sessionIdFromMultiSessionPath('/session/multi'), null);
  assert.equal(sessionIdFromMultiSessionPath('/session/multi/'), null);
});

test('sessionIdFromMultiSessionPath rejects a path outside multi sessions', () => {
  assert.equal(
    sessionIdFromMultiSessionPath(`/session/solo/${sessionId}`),
    null,
  );
  assert.equal(
    sessionIdFromMultiSessionPath(`/session/multi/${sessionId}/results`),
    null,
  );
});
