import { useError } from '@cityborn/contexts';
import { ApiError } from '@cityborn/errors';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { initSocket } from '@/lib/socket';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  const { invokeError } = useError();

  useEffect(() => {
    let mounted = true;

    initSocket().then((socket: Socket) => {
      console.log('initialized');
      if (!mounted) return;

      socketRef.current = socket;

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
    });

    return () => {
      mounted = false;

      const socket = socketRef.current;

      if (!socket) return;

      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();

      socketRef.current = null;
      console.log('Cleaning up socket');
    };
  }, []);

  // Méthodes propres pour émettre / écouter
  const emit = useCallback((event: string, ...args: any[]) => {
    const lastArg = args[args.length - 1];
    const hasCallback = typeof lastArg === 'function';

    if (hasCallback) {
      const callback = args.pop();
      socketRef.current?.emit(event, ...args, callback);
    } else {
      socketRef.current?.emit(event, ...args);
    }
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.on(event, callback);
    },
    [],
  );

  const off = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socketRef.current?.off(event, callback);
    },
    [],
  );

  return {
    connected,
    hasDisconnected,
    emit,
    on,
    off,
    connect: () => socketRef.current?.connect(),
    disconnect: () => socketRef.current?.disconnect(),
    socket: socketRef.current,
  };
};
