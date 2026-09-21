import type {
  SocketConnection,
  SocketFactory,
  SocketListenEvent,
} from '@cityborn/client/platform';
import { io, type Socket } from 'socket.io-client';
import { getOrCreateVisitorId } from './visitorId';

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_BACKEND_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

declare global {
  interface Window {
    socket: Socket;
  }
}

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(WEBSOCKET_URL, {
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
