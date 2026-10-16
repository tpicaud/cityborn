import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type SessionId, SessionIdSchema } from '@cityborn/api';
import { multiSessionPath, sessionIdFromMultiSessionPath } from './sessionPath';

const sessionId: SessionId = SessionIdSchema.parse('brave-golden-lynx');

describe('sessionIdFromMultiSessionPath', () => {
  it('reads the session of a multi session path', () => {
    const path: string = multiSessionPath(sessionId);

    const readSessionId: SessionId | null = sessionIdFromMultiSessionPath(path);

    assert.equal(readSessionId, 'brave-golden-lynx');
  });

  it('rejects a path without session', () => {
    const paths: string[] = ['/session/multi', '/session/multi/'];

    const readSessionIds: (SessionId | null)[] = paths.map(
      sessionIdFromMultiSessionPath,
    );

    assert.deepEqual(readSessionIds, [null, null]);
  });

  it('rejects a path outside multi sessions', () => {
    const paths: string[] = [
      `/session/solo/${sessionId}`,
      `/session/multi/${sessionId}/results`,
    ];

    const readSessionIds: (SessionId | null)[] = paths.map(
      sessionIdFromMultiSessionPath,
    );

    assert.deepEqual(readSessionIds, [null, null]);
  });
});
