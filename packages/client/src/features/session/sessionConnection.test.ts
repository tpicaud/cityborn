import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiError } from '@cityborn/api';
import { ErrorCode } from '@cityborn/api';
import type {
  SocketConnectError,
  SocketConnection,
} from '../../platform/socket';
import {
  type SessionConnection,
  type SessionConnectionStatus,
  superviseSessionConnection,
} from './sessionConnection';

type Listener = (...args: unknown[]) => void;

type FakeSocket = {
  socket: SocketConnection;
  state: { connected: boolean; active: boolean };
  connectCalls: () => number;
  disconnectCalls: () => number;
  listenerCount: () => number;
  fire: (event: string, ...args: unknown[]) => void;
};

type Supervision = {
  connection: SessionConnection;
  statuses: SessionConnectionStatus[];
  failures: unknown[];
  restoreCalls: () => number;
  refreshCalls: () => number;
};

type SupervisionOptions = {
  restoreSession?: () => Promise<void>;
  refreshAuthentication?: () => Promise<void>;
};

const rateLimitError: ApiError = {
  code: ErrorCode.RATE_LIMIT_EXCEEDED,
  statusCode: 429,
  message: 'Too many connections',
};

const expiredTokenError: ApiError = {
  code: ErrorCode.TOKEN_EXPIRED,
  statusCode: 401,
  message: 'Token expired',
};

function isListener(value: unknown): value is Listener {
  return typeof value === 'function';
}

function connectError(data?: ApiError): SocketConnectError {
  const error: SocketConnectError = new Error('connect failed');
  error.data = data;
  return error;
}

function settle(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function createFakeSocket(): FakeSocket {
  const listeners: Map<string, unknown[]> = new Map();
  const state: FakeSocket['state'] = { connected: false, active: false };
  let connectCalls = 0;
  let disconnectCalls = 0;

  const add = (event: string, listener: unknown): void => {
    listeners.set(event, [...(listeners.get(event) ?? []), listener]);
  };

  const remove = (event: string, listener: unknown): void => {
    listeners.set(
      event,
      (listeners.get(event) ?? []).filter((current) => current !== listener),
    );
  };

  const socket: SocketConnection = {
    get connected() {
      return state.connected;
    },
    get active() {
      return state.active;
    },
    connect: () => {
      connectCalls += 1;
      state.active = true;
    },
    disconnect: () => {
      disconnectCalls += 1;
      state.connected = false;
      state.active = false;
    },
    emit: () => {},
    on: (event, listener) => add(event, listener),
    off: (event, listener) => remove(event, listener),
    onReconnection: (event, listener) => add(event, listener),
    offReconnection: (event, listener) => remove(event, listener),
  };

  return {
    socket,
    state,
    connectCalls: () => connectCalls,
    disconnectCalls: () => disconnectCalls,
    listenerCount: () =>
      [...listeners.values()].reduce(
        (count: number, registered: unknown[]) => count + registered.length,
        0,
      ),
    fire: (event, ...args) => {
      (listeners.get(event) ?? []).filter(isListener).forEach((listener) => {
        listener(...args);
      });
    },
  };
}

function supervise(
  fake: FakeSocket,
  options: SupervisionOptions = {},
): Supervision {
  const statuses: SessionConnectionStatus[] = [];
  const failures: unknown[] = [];
  let restoreCalls = 0;
  let refreshCalls = 0;

  const connection: SessionConnection = superviseSessionConnection(
    fake.socket,
    {
      restoreSession: async () => {
        restoreCalls += 1;
        await options.restoreSession?.();
      },
      refreshAuthentication: async () => {
        refreshCalls += 1;
        await options.refreshAuthentication?.();
      },
      onStatusChange: (status) => statuses.push(status),
      onFailure: (error) => failures.push(error),
    },
  );

  return {
    connection,
    statuses,
    failures,
    restoreCalls: () => restoreCalls,
    refreshCalls: () => refreshCalls,
  };
}

async function connect(fake: FakeSocket): Promise<void> {
  fake.state.connected = true;
  fake.state.active = true;
  fake.fire('connect');
  await settle();
}

function dropConnection(fake: FakeSocket, reason: string): void {
  fake.state.connected = false;
  fake.fire('disconnect', reason);
}

function rejectHandshake(fake: FakeSocket, data?: ApiError): void {
  fake.state.active = false;
  fake.fire('connect_error', connectError(data));
}

test('ouvre la connexion puis passe connecté une fois la session restaurée', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);

  assert.equal(fake.connectCalls(), 1);
  await connect(fake);

  assert.deepEqual(supervision.statuses, ['connecting', 'connected']);
  assert.equal(supervision.restoreCalls(), 1);
});

test('restaure la session à chaque nouvelle connexion, même après un échec intermédiaire', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);

  dropConnection(fake, 'transport close');
  fake.fire('connect_error', connectError());
  fake.fire('reconnect_attempt');
  await connect(fake);

  assert.deepEqual(supervision.statuses, [
    'connecting',
    'connected',
    'reconnecting',
    'reconnecting',
    'connected',
  ]);
  assert.equal(supervision.restoreCalls(), 2);
  assert.deepEqual(supervision.failures, []);
});

test('se reconnecte explicitement après une déconnexion par le serveur', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);

  fake.state.active = false;
  dropConnection(fake, 'io server disconnect');

  assert.equal(fake.connectCalls(), 2);
  assert.equal(supervision.statuses.at(-1), 'reconnecting');
});

test('ferme la connexion avec une seule erreur quand le serveur refuse le handshake', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);

  rejectHandshake(fake, rateLimitError);

  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [rateLimitError]);
});

test('n’affiche qu’une erreur pour une séquence de reconnexion abandonnée', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);
  dropConnection(fake, 'transport close');

  const lastError: SocketConnectError = connectError();
  fake.fire('connect_error', connectError());
  fake.fire('connect_error', lastError);
  fake.fire('reconnect_failed');

  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [lastError]);
});

test('rafraîchit l’authentification puis se reconnecte quand le token est refusé', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);

  rejectHandshake(fake, expiredTokenError);
  await settle();

  assert.equal(supervision.refreshCalls(), 1);
  assert.equal(fake.connectCalls(), 2);
  assert.deepEqual(supervision.failures, []);

  rejectHandshake(fake, expiredTokenError);

  assert.equal(supervision.refreshCalls(), 1);
  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [expiredTokenError]);
});

test('ignore la restauration d’une connexion déjà perdue', async () => {
  const fake: FakeSocket = createFakeSocket();
  let resolveRestore: () => void = () => {};
  const supervision: Supervision = supervise(fake, {
    restoreSession: () =>
      new Promise<void>((resolve) => {
        resolveRestore = resolve;
      }),
  });

  fake.state.connected = true;
  fake.fire('connect');
  dropConnection(fake, 'transport close');
  resolveRestore();
  await settle();

  assert.deepEqual(supervision.statuses, ['connecting', 'reconnecting']);
});

test('ferme la connexion quand la restauration de la session échoue', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake, {
    restoreSession: () => Promise.reject(rateLimitError),
  });

  await connect(fake);

  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [rateLimitError]);
});

test('réessaie la restauration sur une connexion toujours ouverte', async () => {
  const fake: FakeSocket = createFakeSocket();
  let shouldFail = true;
  const supervision: Supervision = supervise(fake, {
    restoreSession: () =>
      shouldFail ? Promise.reject(rateLimitError) : Promise.resolve(),
  });
  await connect(fake);

  shouldFail = false;
  supervision.connection.retry();
  await settle();

  assert.equal(supervision.restoreCalls(), 2);
  assert.equal(supervision.statuses.at(-1), 'connected');
});

test('se détache du socket à la fermeture', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);

  supervision.connection.close();
  fake.fire('disconnect', 'io client disconnect');

  assert.equal(fake.disconnectCalls(), 1);
  assert.equal(fake.listenerCount(), 0);
  assert.equal(supervision.statuses.at(-1), 'connected');
});
