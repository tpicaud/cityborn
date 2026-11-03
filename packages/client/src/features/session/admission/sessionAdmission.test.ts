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
  SessionReconnectTokenSchema,
  SessionStatus,
  type UserId,
  UserIdSchema,
} from '@cityborn/api';
import type { SessionChannel } from '../../../domains/session/sessionApi';
import {
  admitSessionPlayer,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
} from './sessionAdmission';

const userId: UserId = UserIdSchema.parse('user-1');
const playerID: PlayerId = PlayerIdSchema.parse('friend');

function createChannel(): Pick<SessionChannel, 'join' | 'reconnect'> {
  return {
    join: mock.fn(async () => ({
      reconnectToken: SessionReconnectTokenSchema.parse('guest-token'),
    })),
    reconnect: mock.fn(async () => {}),
  };
}

describe('admitSessionPlayer', () => {
  it('does not restore a guest with a matching account identity', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: userId, isGuest: true })],
    });
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const reconnect: Mock<SessionChannel['reconnect']> = mock.method(
      channel,
      'reconnect',
    );

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(reconnect.mock.callCount(), 0);
  });

  it('does not restore an account by nickname when the requester is anonymous', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: userId })],
    });
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const reconnect: Mock<SessionChannel['reconnect']> = mock.method(
      channel,
      'reconnect',
    );

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId: undefined }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(reconnect.mock.callCount(), 0);
  });
  it('joins a new guest and keeps the reconnect token in memory', async () => {
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const join: Mock<SessionChannel['join']> = mock.method(channel, 'join');
    const reconnect: Mock<SessionChannel['reconnect']> = mock.method(
      channel,
      'reconnect',
    );

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
    assert.deepEqual(join.mock.calls[0]?.arguments, [
      { sessionID: 'session-1', playerID: 'friend' },
    ]);
    assert.equal(reconnect.mock.callCount(), 0);
  });

  it('joins an account that is not already a participant', async () => {
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const join: Mock<SessionChannel['join']> = mock.method(
      channel,
      'join',
      async () => ({
        reconnectToken: undefined,
      }),
    );

    const joined: JoinedSessionPlayer = await admitSessionPlayer({
      session: buildSession(),
      channel,
      playerID,
      userId,
    });

    assert.deepEqual(joined, { playerID: 'friend', reconnectToken: undefined });
    assert.equal(join.mock.callCount(), 1);
  });

  it('restores the account in the lobby or during the game after backend validation', async () => {
    await Promise.all(
      [SessionStatus.IN_LOBBY, SessionStatus.IN_GAME].map(async (status) => {
        const session: Session = buildSession({
          status,
          players: [buildPlayer({ username: 'old-name', id: userId })],
        });
        const channel: Pick<SessionChannel, 'join' | 'reconnect'> =
          createChannel();
        const reconnect: Mock<SessionChannel['reconnect']> = mock.method(
          channel,
          'reconnect',
        );
        const join: Mock<SessionChannel['join']> = mock.method(channel, 'join');

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
        assert.deepEqual(reconnect.mock.calls[0]?.arguments, [
          {
            sessionID: 'session-1',
            playerID: 'old-name',
            reconnectToken: undefined,
          },
        ]);
        assert.equal(join.mock.callCount(), 0);
      }),
    );
  });

  it('does not admit an account when the backend rejects its restoration', async () => {
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const rejection: Error = new Error('identity rejected');
    mock.method(channel, 'reconnect', async () => {
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
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    const join: Mock<SessionChannel['join']> = mock.method(channel, 'join');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        error instanceof ApiResponseError &&
        error.apiError.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.equal(join.mock.callCount(), 0);
  });

  it('propagates a game starting while the guest enters a nickname', async () => {
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const channel: Pick<SessionChannel, 'join' | 'reconnect'> = createChannel();
    mock.method(channel, 'join', async () => {
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
