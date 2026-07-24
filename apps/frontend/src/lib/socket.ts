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
