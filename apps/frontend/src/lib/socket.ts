import type {
  SocketConnection,
  SocketFactory,
  SocketListenEvent,
} from '@cityborn/client/platform';
import { io, type Socket } from 'socket.io-client';
import { frontendClientConfig } from '@/config/client';
import { getOrCreateVisitorId } from './visitorId';

let socket: Socket | null = null;

declare global {
  interface Window {
    socket: Socket;
  }
}

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(frontendClientConfig.websocketBackendUrl, {
      transports: ['websocket'],
      withCredentials: true,
      query: {
        'x-visitor-id': getOrCreateVisitorId() || null,
      },
    });
  }
  return socket;
};

function toUntypedEventName(event: SocketListenEvent): string {
  return event;
}

function toSocketConnection(socket: Socket): SocketConnection {
  return {
    get connected() {
      return socket.connected;
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
  };
}

export const createSocketConnection: SocketFactory = async () =>
  toSocketConnection(getSocket());
