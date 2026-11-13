import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
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
