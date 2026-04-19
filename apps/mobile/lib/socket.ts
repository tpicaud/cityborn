import { io, Socket } from 'socket.io-client';
import { getOrCreateVisitorId } from './visitorId';
import { tokenStorage } from './tokenStorage';

const WEBSOCKET_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

export async function initSocket(): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const access_token = await tokenStorage.getAccessToken();

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket'],
    auth: {
      access_token: access_token || null,
    },
    query: {
      'x-visitor-id': getOrCreateVisitorId() || null,
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
