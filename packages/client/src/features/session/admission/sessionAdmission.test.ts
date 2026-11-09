import assert from 'node:assert/strict';
import { describe, it, type Mock, mock } from 'node:test';
import {
  ApiResponseError,
  buildGame,
  buildPlayer,
  buildSession,
  ErrorCode,
  isApiError,
  type PlayerId,
  PlayerIdSchema,
  resolveErrorMessage,
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
  createSessionAdmissionDecision,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
  type SessionAdmission,
  type SessionAdmissionDecision,
} from './sessionAdmission';

const userId: UserId = UserIdSchema.parse('user-1');
const playerID: PlayerId = PlayerIdSchema.parse('friend');

function createChannel(
  acknowledgement: SessionJoinAck | ApiResponseError = {
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
        respond(
          acknowledgement instanceof ApiResponseError
            ? { success: false, error: acknowledgement.apiError }
            : { success: true, ...acknowledgement },
        );
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
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel(rejection);
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        isApiError(error) && error.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.deepEqual(emit.mock.calls[0]?.arguments, [
      sessionWsEvent.join,
      { sessionID: 'session-1', playerID: 'friend' },
    ]);
    assert.equal(emit.mock.callCount(), 1);
  });

  it('does not restore an account by nickname when the requester is anonymous', async () => {
    const session: Session = buildSession({
      status: SessionStatus.IN_GAME,
      players: [buildPlayer({ username: 'friend', id: userId })],
    });
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel(rejection);
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId: undefined }),
      (error: unknown) =>
        isApiError(error) && error.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.deepEqual(emit.mock.calls[0]?.arguments, [
      sessionWsEvent.join,
      { sessionID: 'session-1', playerID: 'friend' },
    ]);
    assert.equal(emit.mock.callCount(), 1);
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

  it('lets the backend refuse new participants even when their nickname already exists', async () => {
    const session: Session = buildSession({
      currentGame: buildGame(),
      players: [buildPlayer({ username: 'friend', id: 'someone-else' })],
    });
    const rejection: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const channel: Pick<SessionChannel, 'emit'> = createChannel(rejection);
    const emit: Mock<SessionChannel['emit']> = mock.method(channel, 'emit');

    await assert.rejects(
      admitSessionPlayer({ session, channel, playerID, userId }),
      (error: unknown) =>
        isApiError(error) && error.code === ErrorCode.SESSION_ALREADY_IN_GAME,
    );
    assert.deepEqual(emit.mock.calls[0]?.arguments, [
      sessionWsEvent.join,
      { sessionID: 'session-1', playerID: 'friend' },
    ]);
    assert.equal(emit.mock.callCount(), 1);
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

describe('createSessionAdmissionDecision', () => {
  it('allows an anonymous visitor to enter a nickname in the lobby', () => {
    const decision: SessionAdmissionDecision = createSessionAdmissionDecision({
      session: buildSession(),
      admission: { status: 'idle' },
      automaticPlayerID: undefined,
    });

    assert.equal(decision.isAdmitting, false);
    assert.equal(decision.returnToHome, false);
  });

  it('rejects an idle visitor when the game starts during nickname entry', () => {
    const decision: SessionAdmissionDecision = createSessionAdmissionDecision({
      session: buildSession({ status: SessionStatus.IN_GAME }),
      admission: { status: 'idle' },
      automaticPlayerID: undefined,
    });

    assert.equal(decision.returnToHome, true);
    assert.equal(
      resolveErrorMessage(decision.error),
      'La partie a déjà commencé',
    );
  });

  it('rejects a visitor when the game starts after a duplicate nickname or network rejection', () => {
    const failures: Error[] = [
      new ApiResponseError({
        code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS,
        statusCode: 409,
        message: 'nickname already exists',
      }),
      new TypeError('network unavailable'),
    ];

    failures.forEach((error) => {
      const admission: SessionAdmission = { status: 'rejected', error };
      const lobby: SessionAdmissionDecision = createSessionAdmissionDecision({
        session: buildSession(),
        admission,
        automaticPlayerID: undefined,
      });
      const started: SessionAdmissionDecision = createSessionAdmissionDecision({
        session: buildSession({ status: SessionStatus.IN_GAME }),
        admission,
        automaticPlayerID: undefined,
      });

      assert.equal(lobby.error, error);
      assert.equal(lobby.returnToHome, false);
      assert.equal(lobby.isAdmitting, false);
      assert.equal(
        resolveErrorMessage(started.error),
        'La partie a déjà commencé',
      );
      assert.equal(started.returnToHome, true);
    });
  });

  it('waits for a successful acknowledgement when the game starts during admission', () => {
    const session: Session = buildSession({ status: SessionStatus.IN_GAME });
    const pending: SessionAdmissionDecision = createSessionAdmissionDecision({
      session,
      admission: { status: 'pending' },
      automaticPlayerID: undefined,
    });
    const admitted: SessionAdmissionDecision = createSessionAdmissionDecision({
      session,
      admission: { status: 'admitted', playerID },
      automaticPlayerID: undefined,
    });

    assert.equal(pending.isAdmitting, true);
    assert.equal(pending.error, undefined);
    assert.equal(pending.returnToHome, false);
    assert.equal(admitted.localPlayerID, 'friend');
    assert.equal(admitted.isAdmitting, false);
    assert.equal(admitted.error, undefined);
    assert.equal(admitted.returnToHome, false);
  });

  it('keeps the same server rejection before and after the game update', () => {
    const error: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'game started',
    });
    const admission: SessionAdmission = { status: 'rejected', error };
    const beforeUpdate: SessionAdmissionDecision =
      createSessionAdmissionDecision({
        session: buildSession(),
        admission,
        automaticPlayerID: undefined,
      });
    const afterUpdate: SessionAdmissionDecision =
      createSessionAdmissionDecision({
        session: buildSession({ status: SessionStatus.IN_GAME }),
        admission,
        automaticPlayerID: undefined,
      });

    assert.equal(beforeUpdate.error, error);
    assert.equal(afterUpdate.error, error);
    assert.equal(beforeUpdate.returnToHome, true);
    assert.equal(afterUpdate.returnToHome, true);
  });

  it('leaves a restored account protected until the backend admits it', () => {
    const session: Session = buildSession({ status: SessionStatus.IN_GAME });
    const waitingStates: SessionAdmission[] = [
      { status: 'idle' },
      { status: 'pending' },
    ];

    waitingStates.forEach((admission) => {
      const decision: SessionAdmissionDecision = createSessionAdmissionDecision(
        {
          session,
          admission,
          automaticPlayerID: playerID,
        },
      );

      assert.equal(decision.error, undefined);
      assert.equal(decision.returnToHome, false);
      assert.equal(decision.localPlayerID, undefined);
      assert.equal(decision.isAdmitting, true);
    });
    const admitted: SessionAdmissionDecision = createSessionAdmissionDecision({
      session,
      admission: {
        status: 'admitted',
        playerID: PlayerIdSchema.parse('old-name'),
      },
      automaticPlayerID: playerID,
    });

    assert.equal(admitted.localPlayerID, 'old-name');
    assert.equal(admitted.isAdmitting, false);
    assert.equal(admitted.error, undefined);
    assert.equal(admitted.returnToHome, false);
  });

  it('returns home with the original failure when automatic admission fails', () => {
    const error: Error = new TypeError('network unavailable');
    const decision: SessionAdmissionDecision = createSessionAdmissionDecision({
      session: buildSession({ status: SessionStatus.IN_GAME }),
      admission: { status: 'rejected', error },
      automaticPlayerID: playerID,
    });

    assert.equal(decision.error, error);
    assert.equal(decision.returnToHome, true);
  });

  it('returns home for an expired session without replacing the server error', () => {
    const error: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_NOT_FOUND,
      statusCode: 404,
      message: 'missing',
    });
    const decision: SessionAdmissionDecision = createSessionAdmissionDecision({
      session: buildSession(),
      admission: { status: 'rejected', error },
      automaticPlayerID: undefined,
    });

    assert.equal(decision.error, error);
    assert.equal(decision.returnToHome, true);
  });
});
