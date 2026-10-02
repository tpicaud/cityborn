import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ApiError } from '@cityborn/api';
import { ErrorCode } from '@cityborn/api';
import type { SocketConnectError, SocketConnection } from '../platform/socket';
import {
  superviseWsConnection,
  type WsConnection,
  type WsConnectionStatus,
} from './wsConnection';

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
  connection: WsConnection;
  statuses: WsConnectionStatus[];
  failures: unknown[];
  restorationCalls: () => number;
  refreshCalls: () => number;
};

type SupervisionOptions = {
  restoreChannels?: () => Promise<void>;
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
  const statuses: WsConnectionStatus[] = [];
  const failures: unknown[] = [];
  let restorationCalls = 0;
  let refreshCalls = 0;

  const connection: WsConnection = superviseWsConnection(fake.socket, {
    restoreChannels: async () => {
      restorationCalls += 1;
      await options.restoreChannels?.();
    },
    refreshAuthentication: async () => {
      refreshCalls += 1;
      await options.refreshAuthentication?.();
    },
    onStatusChange: (status) => statuses.push(status),
    onFailure: (error) => failures.push(error),
  });

  return {
    connection,
    statuses,
    failures,
    restorationCalls: () => restorationCalls,
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

test('opens the connection and becomes connected once channels are restored', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);

  assert.equal(fake.connectCalls(), 1);
  await connect(fake);

  assert.deepEqual(supervision.statuses, ['connecting', 'connected']);
  assert.equal(supervision.restorationCalls(), 1);
});

test('restores channels on every new connection, even after an intermediate failure', async () => {
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
  assert.equal(supervision.restorationCalls(), 2);
  assert.deepEqual(supervision.failures, []);
});

test('reconnects explicitly after a server-side disconnection', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);

  fake.state.active = false;
  dropConnection(fake, 'io server disconnect');

  assert.equal(fake.connectCalls(), 2);
  assert.equal(supervision.statuses.at(-1), 'reconnecting');
});

test('closes the connection with a single error when the server rejects the handshake', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);

  rejectHandshake(fake, rateLimitError);

  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [rateLimitError]);
});

test('reports a single error for an abandoned reconnection sequence', async () => {
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

test('refreshes authentication then reconnects when the token is rejected', async () => {
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

test('ignores the restoration of an already lost connection', async () => {
  const fake: FakeSocket = createFakeSocket();
  let resolveRestore: () => void = () => {};
  const supervision: Supervision = supervise(fake, {
    restoreChannels: () =>
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

test('closes the connection when channel restoration fails', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake, {
    restoreChannels: () => Promise.reject(rateLimitError),
  });

  await connect(fake);

  assert.equal(supervision.statuses.at(-1), 'closed');
  assert.deepEqual(supervision.failures, [rateLimitError]);
});

test('retries the restoration on a connection that is still open', async () => {
  const fake: FakeSocket = createFakeSocket();
  let shouldFail = true;
  const supervision: Supervision = supervise(fake, {
    restoreChannels: () =>
      shouldFail ? Promise.reject(rateLimitError) : Promise.resolve(),
  });
  await connect(fake);

  shouldFail = false;
  supervision.connection.retry();
  await settle();

  assert.equal(supervision.restorationCalls(), 2);
  assert.equal(supervision.statuses.at(-1), 'connected');
});

test('detaches from the socket when closed', async () => {
  const fake: FakeSocket = createFakeSocket();
  const supervision: Supervision = supervise(fake);
  await connect(fake);

  supervision.connection.close();
  fake.fire('disconnect', 'io client disconnect');

  assert.equal(fake.disconnectCalls(), 1);
  assert.equal(fake.listenerCount(), 0);
  assert.equal(supervision.statuses.at(-1), 'connected');
});
