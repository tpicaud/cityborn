import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  ApiError,
  GameConfig,
  PlayerId,
  SessionId,
  SessionReconnectToken,
  WsAckSuccessOf,
} from '@cityborn/api';
import {
  ErrorCode,
  PlayerIdSchema,
  SessionIdSchema,
  SessionReconnectTokenSchema,
  sessionWsEvent,
} from '@cityborn/api';
import type { SocketConnection } from './socketConnection';
import { createWsEmit, type WsEmit } from './wsEmit';

type FakeConnection = {
  connection: SocketConnection;
  calls: unknown[][];
};

const sessionID: SessionId = SessionIdSchema.parse('s1');
const playerID: PlayerId = PlayerIdSchema.parse('p1');

function isAckCallback(value: unknown): value is (ack: unknown) => void {
  return typeof value === 'function';
}

function createConnection(ack?: unknown): FakeConnection {
  const calls: unknown[][] = [];

  const connection: SocketConnection = {
    connected: true,
    active: true,
    connect: () => {},
    disconnect: () => {},
    emit: (event, ...args) => {
      const call: unknown[] = [event, ...args];
      calls.push(call);

      const respond: unknown = call[call.length - 1];
      if (ack !== undefined && isAckCallback(respond)) respond(ack);
    },
    on: () => {},
    off: () => {},
    onReconnection: () => {},
    offReconnection: () => {},
  };

  return { connection, calls };
}

describe('createWsEmit', () => {
  it('sends the body before the callback', async () => {
    const { connection, calls }: FakeConnection = createConnection({
      success: true,
    });
    const emit: WsEmit = createWsEmit(connection);

    await emit(sessionWsEvent.join, { sessionID, playerID });

    const [event, body, respond]: unknown[] = calls[0];
    assert.equal(event, 'session:join');
    assert.deepEqual(body, { sessionID: 's1', playerID: 'p1' });
    assert.equal(typeof respond, 'function');
  });

  it('resolves with the data acknowledged by the server', async () => {
    const reconnectToken: SessionReconnectToken =
      SessionReconnectTokenSchema.parse('reconnect-token');
    const { connection }: FakeConnection = createConnection({
      success: true,
      reconnectToken,
    });
    const emit: WsEmit = createWsEmit(connection);

    const joinAck: WsAckSuccessOf<typeof sessionWsEvent.join> = await emit(
      sessionWsEvent.join,
      { sessionID, playerID },
    );

    assert.deepEqual(joinAck, {
      success: true,
      reconnectToken: 'reconnect-token',
    });
  });

  it('rejects acknowledged data outside the contract', async () => {
    const { connection }: FakeConnection = createConnection({
      success: true,
      reconnectToken: '',
    });
    const emit: WsEmit = createWsEmit(connection);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.join>> = emit(
      sessionWsEvent.join,
      {
        sessionID,
        playerID,
      },
    );

    await assert.rejects(emission, { code: ErrorCode.UNKNOWN_ERROR });
  });

  it('emits without a body when the command takes none', async () => {
    const { connection, calls }: FakeConnection = createConnection({
      success: true,
    });
    const emit: WsEmit = createWsEmit(connection);

    await emit(sessionWsEvent.startGame);

    const [event, respond, ...otherArguments]: unknown[] = calls[0];
    assert.equal(event, 'session:startGame');
    assert.equal(typeof respond, 'function');
    assert.deepEqual(otherArguments, []);
  });

  it('rejects with the error returned by the server', async () => {
    const error: ApiError = {
      code: ErrorCode.SESSION_FORBIDDEN_HOST,
      message: 'Seul l’hôte peut démarrer la partie',
      statusCode: 403,
    };
    const { connection }: FakeConnection = createConnection({
      success: false,
      error,
    });
    const emit: WsEmit = createWsEmit(connection);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.startGame>> =
      emit(sessionWsEvent.startGame);

    await assert.rejects(emission, {
      code: ErrorCode.SESSION_FORBIDDEN_HOST,
      message: 'Seul l’hôte peut démarrer la partie',
      statusCode: 403,
    });
  });

  it('normalizes a failure ack without a usable error', async () => {
    const { connection }: FakeConnection = createConnection({
      success: false,
    });
    const emit: WsEmit = createWsEmit(connection);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.nextRound>> =
      emit(sessionWsEvent.nextRound);

    await assert.rejects(emission, {
      code: ErrorCode.UNKNOWN_ERROR,
      statusCode: 500,
    });
  });

  it('normalizes an ack outside the contract envelope', async () => {
    const { connection }: FakeConnection = createConnection({ done: true });
    const emit: WsEmit = createWsEmit(connection);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.nextRound>> =
      emit(sessionWsEvent.nextRound);

    await assert.rejects(emission, { code: ErrorCode.UNKNOWN_ERROR });
  });

  it('rejects a body from an untyped source without emitting anything', async () => {
    const { connection, calls }: FakeConnection = createConnection({
      success: true,
    });
    const emit: WsEmit = createWsEmit(connection);
    const gameConfig: GameConfig = JSON.parse('{"timer":"fast"}');

    const emission: Promise<
      WsAckSuccessOf<typeof sessionWsEvent.updateGameConfig>
    > = emit(sessionWsEvent.updateGameConfig, {
      gameConfig,
    });

    await assert.rejects(emission, {
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
    });
    assert.deepEqual(calls, []);
  });

  it('rejects when the socket is unavailable', async () => {
    const emit: WsEmit = createWsEmit(null);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.join>> = emit(
      sessionWsEvent.join,
      {
        sessionID,
        playerID,
      },
    );

    await assert.rejects(emission, { code: ErrorCode.WS_NOT_CONNECTED });
  });

  it('rejects when the server never acknowledges', async () => {
    const { connection }: FakeConnection = createConnection();
    const emit: WsEmit = createWsEmit(connection, 5);

    const emission: Promise<WsAckSuccessOf<typeof sessionWsEvent.startGame>> =
      emit(sessionWsEvent.startGame);

    await assert.rejects(emission, { code: ErrorCode.WS_ACK_TIMEOUT });
  });
});
