import type {
  SocketConnection,
  SocketFactory,
  SocketListenEvent,
} from '@cityborn/client/platform';
import { io, type Socket } from 'socket.io-client';
import { mobileClientConfig } from '@/config/client';
import { tokenStorage } from './tokenStorage';
import { getOrCreateVisitorId } from './visitorId';

let socket: Socket | null = null;

type HandshakeAuth = { access_token: string | null };

function provideHandshakeAuth(
  provide: (handshakeAuth: HandshakeAuth) => void,
): void {
  tokenStorage.getAccessToken().then(
    (access_token: string | null) =>
      provide({ access_token: access_token || null }),
    () => provide({ access_token: null }),
  );
}

export async function initSocket(): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const visitor_id: string = await getOrCreateVisitorId();

  socket = io(mobileClientConfig.websocketBackendUrl, {
    transports: ['websocket'],
    auth: provideHandshakeAuth,
    query: {
      'x-visitor-id': visitor_id || null,
    },
  });
  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.');
  }
  return socket;
}

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

export const createSocketConnection: SocketFactory = async () =>
  toSocketConnection(await initSocket());
