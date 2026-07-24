import { useError } from '@cityborn/contexts';

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

      socket.on('connect_error', (error: any) => {
        setHasDisconnected(false);
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
  }, [invokeError]);

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
