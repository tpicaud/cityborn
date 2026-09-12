import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ApiError, ErrorCode } from '@cityborn/api';
import { emitWithAck, type SocketAck, type SocketEmit } from './socketRequest';

function createEmit(ack: SocketAck) {
  const calls: unknown[][] = [];

  const emit: SocketEmit = (event, ...args) => {
    calls.push([event, ...args]);
    const respond = args[args.length - 1];
    if (typeof respond === 'function') respond(ack);
  };

  return { emit, calls };
}

test('emitWithAck transmet le corps avant le callback', async () => {
  const { emit, calls } = createEmit({ success: true });

  await emitWithAck(emit, 'session:join', { sessionID: 's1', playerID: 'p1' });

  const [event, body, respond] = calls[0];
  assert.equal(event, 'session:join');
  assert.deepEqual(body, { sessionID: 's1', playerID: 'p1' });
  assert.equal(typeof respond, 'function');
});

test('emitWithAck émet sans corps quand la commande n’en prend pas', async () => {
  const { emit, calls } = createEmit({ success: true });

  await emitWithAck(emit, 'session:startGame');

  assert.equal(calls[0].length, 2);
  assert.equal(typeof calls[0][1], 'function');
});

test('emitWithAck rejette avec l’erreur renvoyée par le serveur', async () => {
  const error: ApiError = {
    code: ErrorCode.SESSION_FORBIDDEN_HOST,
    message: 'Seul l’hôte peut démarrer la partie',
    statusCode: 403,
  };
  const { emit } = createEmit({ success: false, error });

  await assert.rejects(() => emitWithAck(emit, 'session:startGame'), error);
});

test('emitWithAck normalise un accusé d’échec sans erreur exploitable', async () => {
  const { emit } = createEmit({ success: false });

  await assert.rejects(
    () => emitWithAck(emit, 'session:nextRound'),
    (rejected: ApiError) => {
      assert.equal(rejected.code, ErrorCode.UNKNOWN_ERROR);
      assert.equal(rejected.statusCode, 500);
      assert.equal(typeof rejected.message, 'string');
      return true;
    },
  );
});
