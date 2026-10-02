import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TokenStorage } from '../platform/tokenStorage';
import type { SocketConnection } from './socketConnection';
import {
  createBearerSocketFactory,
  createCookieSocketFactory,
  type SocketFactory,
  type SocketFactoryOptions,
} from './socketFactory';

const unreachableWebsocketUrl = 'ws://127.0.0.1:9';

const socketFactoryOptions: SocketFactoryOptions = {
  getVisitorId: async () => 'visitor-id',
};

const tokenStorage: TokenStorage = {
  getAccessToken: async () => 'access-token',
  getRefreshToken: async () => 'refresh-token',
  setTokens: async () => {},
  clearTokens: async () => {},
};

const socketFactories: [string, SocketFactory][] = [
  [
    'cookie',
    createCookieSocketFactory(unreachableWebsocketUrl, socketFactoryOptions),
  ],
  [
    'bearer',
    createBearerSocketFactory(
      unreachableWebsocketUrl,
      tokenStorage,
      socketFactoryOptions,
    ),
  ],
];

socketFactories.forEach(([authenticationMode, createSocket]) => {
  test(`${authenticationMode} socket factory returns a disconnected socket`, async () => {
    const connection: SocketConnection = await createSocket();

    assert.equal(connection.connected, false);
    assert.equal(connection.active, false);
  });
});

test('each socket factory call creates its own socket', async () => {
  const createSocket: SocketFactory = createCookieSocketFactory(
    unreachableWebsocketUrl,
    socketFactoryOptions,
  );
  const firstConnection: SocketConnection = await createSocket();
  const secondConnection: SocketConnection = await createSocket();

  firstConnection.connect();
  const secondConnectionActive: boolean = secondConnection.active;
  firstConnection.disconnect();

  assert.equal(secondConnectionActive, false);
});
