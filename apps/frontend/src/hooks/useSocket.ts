import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useError } from '@/contexts/ErrorContext';
import { getSocket } from '@/lib/socket';

export const useSocket = () => {
  const socket: Socket = getSocket();
  const [connected, setConnected] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  const { invokeError } = useError();

  useEffect(() => {
    // Connect on mount
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setHasDisconnected(true);
      setConnected(false);
    });

    // handle errors
    socket.on('connect_error', (error: any) => {
      setHasDisconnected(false); // Avoid automatic reconnection
      invokeError({
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    });

    socket.on('error', (error: any) => {
      invokeError({
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  // Méthodes propres pour émettre / écouter
  const emit = useCallback((event: string, ...args: any[]) => {
    const lastArg = args[args.length - 1];
    const hasCallback = typeof lastArg === 'function';

    if (hasCallback) {
      const callback = args.pop();
      socket.emit(event, ...args, callback);
    } else {
      socket.emit(event, ...args);
    }
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket.on(event, callback);
    },
    [],
  );

  const off = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket.off(event, callback);
    },
    [],
  );

  return {
    connected,
    hasDisconnected,
    emit,
    on,
    off,
    connect: () => socket.connect(),
    disconnect: () => socket.disconnect(),
    socket,
  };
};
