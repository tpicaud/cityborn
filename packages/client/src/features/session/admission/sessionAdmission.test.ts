import assert from 'node:assert/strict';
import { describe, it, type Mock, mock } from 'node:test';
import {
  ApiResponseError,
  buildPlayer,
  buildSession,
  ErrorCode,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  type SessionJoinAck,
  SessionReconnectTokenSchema,
  SessionStatus,
  sessionWsEvent,
  type UserId,
  UserIdSchema,
} from '@cityborn/api';
import type { SessionChannel } from '../../../domains/session/sessionApi';
import type { SocketConnection } from '../../../ws/socketConnection';
import { createWsEmit } from '../../../ws/wsEmit';
import {
  admitSessionPlayer,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
} from './sessionAdmission';

const userId: UserId = UserIdSchema.parse('user-1');
const playerID: PlayerId = PlayerIdSchema.parse('friend');

function createChannel(
  acknowledgement: SessionJoinAck = {
    reconnectToken: SessionReconnectTokenSchema.parse('guest-token'),
  },
): Pick<SessionChannel, 'emit'> {
  const connection: SocketConnection = {
    connected: true,
    active: true,
    connect: () => {},
    disconnect: () => {},
    emit: (_event, ...args) => {
      const respond: unknown = args[args.length - 1];
      if (typeof respond === 'function')
        respond({ success: true, ...acknowledgement });
    },
    on: () => {},
    off: () => {},
    onReconnection: () => {},
    offReconnection: () => {},
  };
  return { emit: createWsEmit({ connection }) };
}

describe('admitSessionPlayer', () => {
  it('does not restore a guest with a matching account identity', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: userId, isGuest: true })],
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(emit.mock.callCount(), 0);
  });

  it('does not restore an account by nickname when the requester is anonymous', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: userId })],
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId: undefined }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(emit.mock.callCount(), 0);
  });
  it('joins a new guest and keeps the reconnect token in memory', async () => {
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    const joined: JoinedSessionPlayer = await admitSessionPlayer({
      session: buildSession(),
      channel,
      playerID,
      userId: undefined,
    });

    assert.deepEqual(joined, {
      playerID: 'friend',
      reconnectToken: 'guest-token',
    });
    assert.deepEqual(emit.mock.calls[0]?.arguments, [
      sessionWsEvent.join,
      { sessionID: 'session-1', playerID: 'friend' },
    ]);
    assert.equal(emit.mock.callCount(), 1);
  });

  it('joins an account that is not already a participant', async () => {
    const channel: Pick<SessionChannel, 'emit'> = createChannel({});
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    const joined: JoinedSessionPlayer = await admitSessionPlayer({
      session: buildSession(),
      channel,
      playerID,
      userId,
    });

    assert.deepEqual(joined, { playerID: 'friend', reconnectToken: undefined });
    assert.equal(emit.mock.callCount(), 1);
  });

  it('restores the account in the lobby or during the game after backend validation', async () => {
    await Promise.all(
      [SessionStatus.IN_LOBBY, SessionStatus.IN_GAME].map(async (status) => {
        const session: Session = buildSession({
          status,
          players: [buildPlayer({ username: 'old-name', id: userId })],
        });
        const channel: Pick<SessionChannel, 'emit'> = createChannel();
        const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

        const joined: JoinedSessionPlayer = await admitSessionPlayer({
          session,
          channel,
          playerID,
          userId,
        });

        assert.deepEqual(joined, {
          playerID: 'old-name',
          reconnectToken: undefined,
        });
        assert.deepEqual(emit.mock.calls[0]?.arguments, [
          sessionWsEvent.reconnect,
          {
            sessionID: 'session-1',
            playerID: 'old-name',
            reconnectToken: undefined,
          },
        ]);
        assert.equal(emit.mock.callCount(), 1);
      }),
    );
  });

  it('does not admit an account when the backend rejects its restoration', async () => {
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    const rejection: Error = new Error('identity rejected');
    mock.method(channel, 'emit', async () => {
      throw rejection;
    });
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'old-name', id: userId })],
    });

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      rejection,
    );
  });

  it('refuses new participants in a game even when their nickname already exists', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: 'someone-else' })],
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(emit.mock.callCount(), 0);
  });

  it('propagates a game starting while the guest enters a nickname', async () => {
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel();
    mock.method(channel, 'emit', async () => {
      throw rejection;
    });

    await assert.rejects(
      admitSessionPlayer({
        session: buildSession(),
        channel,
        playerID,
        userId: undefined,
      }),
      rejection,
    );
  });
});

describe('isSessionEntryRejected', () => {
  it('identifies a missing or expired session', () => {
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_NOT_FOUND,
      statusCode: 404,
      message: 'missing',
    });

    assert.equal(isSessionEntryRejected(rejection), true);
  });

  it('does not classify a network error or unavailable service as a missing session', () => {
    const unavailable: ApiResponseError = new ApiResponseError({
      code: ErrorCode.UNKNOWN_ERROR,
      statusCode: 503,
      message: 'unavailable',
    });

    assert.equal(isSessionEntryRejected(new TypeError('fetch failed')), false);
    assert.equal(isSessionEntryRejected(unavailable), false);
  });
});
