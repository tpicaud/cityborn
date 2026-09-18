import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiError, GameConfig, PlayerId, SessionId } from '@cityborn/api';
import {
  ErrorCode,
  PlayerIdSchema,
  SessionIdSchema,
  sessionWsEvent,
} from '@cityborn/api';
import type { SocketConnection } from '../platform/socket';
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
  };

  return { connection, calls };
}

test('transmet le corps avant le callback', async () => {
  const { connection, calls } = createConnection({ success: true });
  const emit: WsEmit = createWsEmit(connection);

  await emit(sessionWsEvent.join, { sessionID, playerID });

  const [event, body, respond] = calls[0];
  assert.equal(event, 'session:join');
  assert.deepEqual(body, { sessionID, playerID });
  assert.equal(typeof respond, 'function');
});

test('émet sans corps quand la commande n’en prend pas', async () => {
  const { connection, calls } = createConnection({ success: true });
  const emit: WsEmit = createWsEmit(connection);

  await emit(sessionWsEvent.startGame);

  assert.equal(calls[0].length, 2);
  assert.equal(typeof calls[0][1], 'function');
});

test('rejette avec l’erreur renvoyée par le serveur', async () => {
  const error: ApiError = {
    code: ErrorCode.SESSION_FORBIDDEN_HOST,
    message: 'Seul l’hôte peut démarrer la partie',
    statusCode: 403,
  };
  const { connection } = createConnection({ success: false, error });
  const emit: WsEmit = createWsEmit(connection);

  await assert.rejects(() => emit(sessionWsEvent.startGame), error);
});

test('normalise un accusé d’échec sans erreur exploitable', async () => {
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

test('normalise un accusé hors enveloppe du contrat', async () => {
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

test('rejette un corps venu d’une source non typée, sans rien émettre', async () => {
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

test('rejette quand la socket n’est pas disponible', async () => {
  const emit: WsEmit = createWsEmit(null);

  await assert.rejects(
    () => emit(sessionWsEvent.join, { sessionID, playerID }),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.WS_NOT_CONNECTED);
      return true;
    },
  );
});

test('rejette quand le serveur n’accuse jamais réception', async () => {
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
