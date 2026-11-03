import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSession,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { isHostOf, withStatus } from './sessionState';

const citizen: PlayerId = PlayerIdSchema.parse('citizen');
const otherPlayer: PlayerId = PlayerIdSchema.parse('other');
const session: Session = buildSession({
  hostID: citizen,
  status: SessionStatus.IN_LOBBY,
  players: [],
});

describe('withStatus', () => {
  it('replaces the status without mutating the given session', () => {
    const updated: Session = withStatus(session, SessionStatus.IN_GAME);

    assert.equal(updated.status, SessionStatus.IN_GAME);
    assert.equal(session.status, SessionStatus.IN_LOBBY);
  });
});

describe('isHostOf', () => {
  it('recognizes the host of the session', () => {
    const isHost: boolean = isHostOf(session, citizen);

    assert.equal(isHost, true);
  });

  it('rejects another player', () => {
    const isHost: boolean = isHostOf(session, otherPlayer);

    assert.equal(isHost, false);
  });

  it('rejects a missing player', () => {
    const isHost: boolean = isHostOf(session, undefined);

    assert.equal(isHost, false);
  });

  it('rejects a missing session', () => {
    const isHost: boolean = isHostOf(undefined, citizen);

    assert.equal(isHost, false);
  });
});
