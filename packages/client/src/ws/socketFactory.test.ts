import assert from 'node:assert/strict';
import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, it, type TestContext } from 'node:test';
import { CLIENT_API_VERSION } from '@cityborn/api';
import { Server, type Socket as ServerSocket } from 'socket.io';
import type { TokenStorage } from '../platform/tokenStorage';
import type { SocketConnection } from './socketConnection';
import {
  createBearerSocketFactory,
  createCookieSocketFactory,
  type SocketFactory,
} from './socketFactory';

const unreachableWebsocketUrl: string = 'ws://127.0.0.1:9';

const getVisitorId: () => Promise<string> = async () => 'visitor-id';

const tokenStorage: TokenStorage = {
  getAccessToken: async () => 'access-token',
  getRefreshToken: async () => 'refresh-token',
  setTokens: async () => {},
  clearTokens: async () => {},
};

describe('createCookieSocketFactory', () => {
  it('returns a disconnected socket', async () => {
    const createSocket: SocketFactory = createCookieSocketFactory({
      websocketUrl: unreachableWebsocketUrl,
      getVisitorId,
    });

    const connection: SocketConnection = await createSocket();

    assert.equal(connection.connected, false);
    assert.equal(connection.active, false);
  });

  it('creates its own socket on each call', async (context: TestContext) => {
    const createSocket: SocketFactory = createCookieSocketFactory({
      websocketUrl: unreachableWebsocketUrl,
      getVisitorId,
    });
    const firstConnection: SocketConnection = await createSocket();
    const secondConnection: SocketConnection = await createSocket();
    context.after(() => firstConnection.disconnect());

    firstConnection.connect();

    assert.equal(secondConnection.active, false);
  });
});

describe('createBearerSocketFactory', () => {
  it('returns a disconnected socket', async () => {
    const createSocket: SocketFactory = createBearerSocketFactory({
      websocketUrl: unreachableWebsocketUrl,
      tokenStorage,
      getVisitorId,
    });

    const connection: SocketConnection = await createSocket();

    assert.equal(connection.connected, false);
    assert.equal(connection.active, false);
  });
});

async function createSocketServer(context: TestContext): Promise<{
  server: Server;
  websocketUrl: string;
}> {
  const httpServer: HttpServer = createServer();
  const server: Server = new Server(httpServer);
  await new Promise<void>((resolve) =>
    httpServer.listen(0, '127.0.0.1', resolve),
  );
  context.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address: string | AddressInfo | null = httpServer.address();
  if (address === null || typeof address === 'string')
    throw new Error('Missing server address');
  return { server, websocketUrl: `http://127.0.0.1:${address.port}` };
}

async function connectFactorySocket({
  server,
  connection,
}: {
  server: Server;
  connection: SocketConnection;
}): Promise<ServerSocket> {
  const connected: Promise<ServerSocket> = new Promise((resolve) =>
    server.once('connection', resolve),
  );
  const clientConnected: Promise<void> = new Promise((resolve, reject) => {
    const onConnect: () => void = () => {
      connection.off('connect', onConnect);
      connection.off('connect_error', reject);
      resolve();
    };
    connection.on('connect', onConnect);
    connection.on('connect_error', reject);
  });
  connection.connect();
  await clientConnected;
  return connected;
}

async function disconnectFactorySocket({
  socket,
  connection,
}: {
  socket: ServerSocket;
  connection: SocketConnection;
}): Promise<void> {
  const disconnected: Promise<void> = new Promise((resolve) =>
    socket.once('disconnect', () => resolve()),
  );
  connection.disconnect();
  await disconnected;
}

describe('createSocketFactory handshake metadata', () => {
  it('sends the build version and visitor for cookie connections and reconnections without a token', async (context: TestContext) => {
    const {
      server,
      websocketUrl,
    }: Awaited<ReturnType<typeof createSocketServer>> =
      await createSocketServer(context);
    const factory: SocketFactory = createCookieSocketFactory({
      websocketUrl,
      getVisitorId,
    });
    const connection: SocketConnection = await factory();
    context.after(() => connection.disconnect());

    const first: ServerSocket = await connectFactorySocket({
      server,
      connection,
    });
    assert.deepEqual(first.handshake.auth, { apiVersion: CLIENT_API_VERSION });
    assert.equal(first.handshake.query['x-visitor-id'], 'visitor-id');
    await disconnectFactorySocket({ socket: first, connection });
    const second: ServerSocket = await connectFactorySocket({
      server,
      connection,
    });

    assert.notEqual(first.id, second.id);
    assert.deepEqual(second.handshake.auth, { apiVersion: CLIENT_API_VERSION });
    assert.equal(second.handshake.query['x-visitor-id'], 'visitor-id');
  });

  it('keeps the version while rereading bearer tokens for every connection, including a missing token', async (context: TestContext) => {
    const {
      server,
      websocketUrl,
    }: Awaited<ReturnType<typeof createSocketServer>> =
      await createSocketServer(context);
    let accessToken: string | null = 'first-token';
    const changingTokenStorage: TokenStorage = {
      ...tokenStorage,
      getAccessToken: async () => accessToken,
    };
    const factory: SocketFactory = createBearerSocketFactory({
      websocketUrl,
      getVisitorId,
      tokenStorage: changingTokenStorage,
    });
    const connection: SocketConnection = await factory();
    context.after(() => connection.disconnect());

    const first: ServerSocket = await connectFactorySocket({
      server,
      connection,
    });
    assert.deepEqual(first.handshake.auth, {
      apiVersion: CLIENT_API_VERSION,
      access_token: 'first-token',
    });
    await disconnectFactorySocket({ socket: first, connection });
    accessToken = 'refreshed-token';
    const second: ServerSocket = await connectFactorySocket({
      server,
      connection,
    });
    assert.deepEqual(second.handshake.auth, {
      apiVersion: CLIENT_API_VERSION,
      access_token: 'refreshed-token',
    });
    await disconnectFactorySocket({ socket: second, connection });
    accessToken = null;
    const guest: ServerSocket = await connectFactorySocket({
      server,
      connection,
    });

    assert.deepEqual(guest.handshake.auth, {
      apiVersion: CLIENT_API_VERSION,
      access_token: null,
    });
    assert.equal(guest.handshake.query['x-visitor-id'], 'visitor-id');
  });
});
