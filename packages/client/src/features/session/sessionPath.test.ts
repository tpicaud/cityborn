import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type SessionId, SessionIdSchema, SessionMode } from '@cityborn/api';
import { sessionIdFromSessionPath, sessionPath } from './sessionPath';

const sessionId: SessionId = SessionIdSchema.parse('brave-golden-lynx');

describe('sessionIdFromSessionPath', () => {
  it('reads the session of a solo or multi session path', () => {
    const paths: string[] = [
      sessionPath({ id: sessionId, mode: SessionMode.SOLO }),
      sessionPath({ id: sessionId, mode: SessionMode.MULTI }),
    ];

    const readSessionIds: (SessionId | null)[] = paths.map(
      sessionIdFromSessionPath,
    );

    assert.deepEqual(readSessionIds, [
      'brave-golden-lynx',
      'brave-golden-lynx',
    ]);
  });

  it('rejects a path without session', () => {
    const paths: string[] = [
      '/session/multi',
      '/session/multi/',
      '/session/solo/',
    ];

    const readSessionIds: (SessionId | null)[] = paths.map(
      sessionIdFromSessionPath,
    );

    assert.deepEqual(readSessionIds, [null, null, null]);
  });

  it('rejects a path outside sessions', () => {
    const paths: string[] = [
      `/session/duo/${sessionId}`,
      `/session/multi/${sessionId}/results`,
    ];

    const readSessionIds: (SessionId | null)[] = paths.map(
      sessionIdFromSessionPath,
    );

    assert.deepEqual(readSessionIds, [null, null]);
  });
});
