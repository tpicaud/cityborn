import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type PackId,
  PackIdSchema,
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
  UserFacingError,
} from '@cityborn/api';
import type { NavigationPath } from '../../platform/navigation';
import {
  joinableSessionPath,
  launchedPackIdFromSearchParams,
  packLaunchSessionPath,
  sessionIdFromSessionPath,
  sessionPath,
} from './sessionPath';

const sessionId: SessionId = SessionIdSchema.parse('brave-golden-lynx');
const packId: PackId = PackIdSchema.parse('pack nba');

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

describe('packLaunchSessionPath', () => {
  it('carries the launched pack in the query of the session path', () => {
    const soloSession: Pick<Session, 'id' | 'mode'> = {
      id: sessionId,
      mode: SessionMode.SOLO,
    };

    const path: NavigationPath = packLaunchSessionPath({
      session: soloSession,
      packId,
    });

    assert.equal(path, '/session/solo/brave-golden-lynx?pack=pack%20nba');
  });
});

describe('launchedPackIdFromSearchParams', () => {
  it('reads the launched pack of the search params', () => {
    const launchedPackId: PackId | undefined = launchedPackIdFromSearchParams({
      pack: 'pack nba',
      mode: 'solo',
    });

    assert.equal(launchedPackId, 'pack nba');
  });

  it('ignores a missing, empty or repeated launched pack', () => {
    const searchParams: Record<string, string | string[] | undefined>[] = [
      {},
      { pack: undefined },
      { pack: '' },
      { pack: ['pack-a', 'pack-b'] },
    ];

    const launchedPackIds: (PackId | undefined)[] = searchParams.map(
      launchedPackIdFromSearchParams,
    );

    assert.deepEqual(launchedPackIds, [
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});
