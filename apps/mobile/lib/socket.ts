import { io, Socket } from 'socket.io-client';
import { getOrCreateVisitorId } from './visitorId';

const WEBSOCKET_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

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
