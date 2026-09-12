import type { SocketConnection } from '@cityborn/client/ports';
import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';
import { getOrCreateVisitorId } from './visitorId';

const WEBSOCKET_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

async function initSocket(): Promise<Socket> {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const access_token = await tokenStorage.getAccessToken();

  socket = io(WEBSOCKET_URL, {
    transports: ['websocket'],
    auth: { access_token: access_token || null },
    query: { 'x-visitor-id': await getOrCreateVisitorId() },
  });
  return socket;
}

export async function connectSessionSocket(): Promise<SocketConnection> {
  const connectedSocket = await initSocket();

  return {
    get connected() {
      return connectedSocket.connected;
    },
    connect: () => {
      connectedSocket.connect();
    },
    disconnect: () => {
      connectedSocket.disconnect();
    },
    emit: (event, ...args) => {
      connectedSocket.emit(event, ...args);
    },
    on: (event, listener) => {
      connectedSocket.on(event, listener);
    },
    off: (event, listener) => {
      connectedSocket.off(event, listener);
    },
  };
}
