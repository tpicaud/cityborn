import type {
  SocketConnection,
  SocketFactory,
} from '@cityborn/client/platform';
import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';
import { getOrCreateVisitorId } from './visitorId';

const WEBSOCKET_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

export async function initSocket(): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const [access_token, visitor_id] = await Promise.all([
    tokenStorage.getAccessToken(),
    getOrCreateVisitorId(),
  ]);

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket'],
    auth: {
      access_token: access_token || null,
    },
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
      socket.on(event, listener);
    },
    off: (event, listener) => {
      socket.off(event, listener);
    },
  };
}

export const createSocketConnection: SocketFactory = async () =>
  toSocketConnection(await initSocket());
