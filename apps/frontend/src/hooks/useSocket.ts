import { useError } from '@/contexts/ErrorContext';
import { getSocket } from '@/lib/socket';
import { ApiError } from '@cityborn/errors';
import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

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
      const api_error = new ApiError(
        error.code,
        error.message,
        error.statusCode,
      );
      invokeError(api_error);
    });

    socket.on('error', (error: any) => {
      const api_error = new ApiError(
        error.code,
        error.message,
        error.statusCode,
      );
      invokeError(api_error);
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
