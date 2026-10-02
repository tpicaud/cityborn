import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from 'socket.io-client';
import type { TokenStorage } from '../platform/tokenStorage';
import type { SocketConnection, SocketListenEvent } from './socketConnection';

export type SocketFactory = () => Promise<SocketConnection>;

export type SocketFactoryOptions = {
  getVisitorId: () => string | Promise<string>;
};

type SocketAuthenticationOptions = Pick<
  Partial<ManagerOptions & SocketOptions>,
  'auth' | 'withCredentials'
>;

type HandshakeAuth = { access_token: string | null };

function toUntypedEventName(event: SocketListenEvent): string {
  return event;
}

function toSocketConnection(socket: Socket): SocketConnection {
  return {
    get connected() {
      return socket.connected;
    },
    get active() {
      return socket.active;
    },
    connect: () => {
      socket.connect();
    },
    disconnect: () => {
      socket.disconnect();
    },
    emit: (event, ...args) => {
      socket.emit(event, ...args);
    },
    on: (event, listener) => {
      socket.on(toUntypedEventName(event), listener);
    },
    off: (event, listener) => {
      socket.off(toUntypedEventName(event), listener);
    },
    onReconnection: (event, listener) => {
      socket.io.on(event, listener);
    },
    offReconnection: (event, listener) => {
      socket.io.off(event, listener);
    },
  };
}

function createSocketFactory(
  websocketUrl: string,
  authenticationOptions: SocketAuthenticationOptions,
  options: SocketFactoryOptions,
): SocketFactory {
  return async () => {
    const visitorId: string = await options.getVisitorId();
    const socket: Socket = io(websocketUrl, {
      ...authenticationOptions,
      autoConnect: false,
      transports: ['websocket'],
      query: { 'x-visitor-id': visitorId },
    });
    return toSocketConnection(socket);
  };
}

export function createBearerSocketFactory(
  websocketUrl: string,
  tokenStorage: TokenStorage,
  options: SocketFactoryOptions,
): SocketFactory {
  return createSocketFactory(
    websocketUrl,
    {
      auth: (provide: (handshakeAuth: HandshakeAuth) => void) => {
        tokenStorage.getAccessToken().then(
          (accessToken: string | null) =>
            provide({ access_token: accessToken }),
          () => provide({ access_token: null }),
        );
      },
    },
    options,
  );
}

export function createCookieSocketFactory(
  websocketUrl: string,
  options: SocketFactoryOptions,
): SocketFactory {
  return createSocketFactory(websocketUrl, { withCredentials: true }, options);
}
