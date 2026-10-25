import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
  UserFacingError,
} from '@cityborn/api';
import type { NavigationPath } from '../../platform/navigation';
import {
  joinableSessionPath,
  sessionIdFromSessionPath,
  sessionPath,
} from './sessionPath';

const sessionId: SessionId = SessionIdSchema.parse('brave-golden-lynx');

describe('joinableSessionPath', () => {
  it('returns the path of a multi session', () => {
    const multiSession: Pick<Session, 'id' | 'mode'> = {
      id: sessionId,
      mode: SessionMode.MULTI,
    };

    const path: NavigationPath = joinableSessionPath(multiSession);

    assert.equal(path, '/session/multi/brave-golden-lynx');
  });

  it('rejects a solo session', () => {
    const soloSession: Pick<Session, 'id' | 'mode'> = {
      id: sessionId,
      mode: SessionMode.SOLO,
    };

    assert.throws(
      () => joinableSessionPath(soloSession),
      new UserFacingError('Une session solo ne peut pas être rejointe.'),
    );
  });
});

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
