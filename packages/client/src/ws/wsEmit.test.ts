import assert from 'node:assert/strict';
import { test } from 'node:test';
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

const sessionID: SessionId = SessionIdSchema.parse('s1');
const playerID: PlayerId = PlayerIdSchema.parse('p1');

function isAckCallback(value: unknown): value is (ack: unknown) => void {
  return typeof value === 'function';
}

function createConnection(ack?: unknown): {
  connection: SocketConnection;
  calls: unknown[][];
} {
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

test('sends the body before the callback', async () => {
  const { connection, calls } = createConnection({ success: true });
  const emit: WsEmit = createWsEmit(connection);

  await emit(sessionWsEvent.join, { sessionID, playerID });

  const [event, body, respond] = calls[0];
  assert.equal(event, 'session:join');
  assert.deepEqual(body, { sessionID, playerID });
  assert.equal(typeof respond, 'function');
});

test('resolves with the data acknowledged by the server', async () => {
  const reconnectToken: SessionReconnectToken =
    SessionReconnectTokenSchema.parse('reconnect-token');
  const { connection } = createConnection({ success: true, reconnectToken });
  const emit: WsEmit = createWsEmit(connection);

  const joinAck: WsAckSuccessOf<typeof sessionWsEvent.join> = await emit(
    sessionWsEvent.join,
    { sessionID, playerID },
  );

  assert.deepEqual(joinAck, { success: true, reconnectToken });
});

test('rejects acknowledged data outside the contract', async () => {
  const { connection } = createConnection({
    success: true,
    reconnectToken: '',
  });
  const emit: WsEmit = createWsEmit(connection);

  await assert.rejects(
    () => emit(sessionWsEvent.join, { sessionID, playerID }),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.UNKNOWN_ERROR);
      return true;
    },
  );
});

test('emits without a body when the command takes none', async () => {
  const { connection, calls } = createConnection({ success: true });
  const emit: WsEmit = createWsEmit(connection);

  await emit(sessionWsEvent.startGame);

  assert.equal(calls[0].length, 2);
  assert.equal(typeof calls[0][1], 'function');
});

test('rejects with the error returned by the server', async () => {
  const error: ApiError = {
    code: ErrorCode.SESSION_FORBIDDEN_HOST,
    message: 'Seul l’hôte peut démarrer la partie',
    statusCode: 403,
  };
  const { connection } = createConnection({ success: false, error });
  const emit: WsEmit = createWsEmit(connection);

  await assert.rejects(() => emit(sessionWsEvent.startGame), error);
});

test('normalizes a failure ack without a usable error', async () => {
  const { connection } = createConnection({ success: false });
  const emit: WsEmit = createWsEmit(connection);

  await assert.rejects(
    () => emit(sessionWsEvent.nextRound),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.UNKNOWN_ERROR);
      assert.equal(rejected.statusCode, 500);
      return true;
    },
  );
});

test('normalizes an ack outside the contract envelope', async () => {
  const { connection } = createConnection({ done: true });
  const emit: WsEmit = createWsEmit(connection);

  await assert.rejects(
    () => emit(sessionWsEvent.nextRound),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.UNKNOWN_ERROR);
      return true;
    },
  );
});

test('rejects a body from an untyped source without emitting anything', async () => {
  const { connection, calls } = createConnection({ success: true });
  const emit: WsEmit = createWsEmit(connection);
  const gameConfig: GameConfig = JSON.parse('{"timer":"fast"}');

  await assert.rejects(
    () => emit(sessionWsEvent.updateGameConfig, { gameConfig }),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.BAD_REQUEST);
      assert.equal(rejected.statusCode, 400);
      return true;
    },
  );
  assert.equal(calls.length, 0);
});

test('rejects when the socket is unavailable', async () => {
  const emit: WsEmit = createWsEmit(null);

  await assert.rejects(
    () => emit(sessionWsEvent.join, { sessionID, playerID }),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.WS_NOT_CONNECTED);
      return true;
    },
  );
});

test('rejects when the server never acknowledges', async () => {
  const { connection } = createConnection();
  const emit: WsEmit = createWsEmit(connection, 5);

  await assert.rejects(
    () => emit(sessionWsEvent.startGame),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.WS_ACK_TIMEOUT);
      return true;
    },
  );
});
