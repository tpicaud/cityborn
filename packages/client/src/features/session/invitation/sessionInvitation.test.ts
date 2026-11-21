import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSession,
  type Session,
  SessionMode,
  UserFacingError,
} from '@cityborn/api';
import type { ShareContent } from '../../../platform/sharing';
import { createSessionInvitation } from './sessionInvitation';

describe('createSessionInvitation', () => {
  it('includes the session code and a web link in the same environment', () => {
    const session: Session = buildSession({ id: '123456' });
    const origins: string[] = [
      'https://cityborn.app',
      'https://staging.cityborn.app',
      'https://cityborn-preview.vercel.app',
      'http://192.168.1.2:3000',
    ];

    const invitations: ShareContent[] = origins.map((webAppUrl) =>
      createSessionInvitation({ session, webAppUrl }),
    );

    assert.deepEqual(
      invitations.map((invitation) => invitation.url),
      origins.map((origin) => `${origin}/session/multi/123456`),
    );
    assert.equal(invitations[0]?.title, 'Cityborn');
    assert.equal(
      invitations[0]?.message,
      'Rejoins ma partie sur Cityborn ! Code : 123456',
    );
  });

  it('refuses an invitation to a solo session', () => {
    const session: Session = buildSession({ mode: SessionMode.SOLO });

    assert.throws(
      () =>
        createSessionInvitation({ session, webAppUrl: 'https://cityborn.app' }),
      UserFacingError,
    );
  });
});
