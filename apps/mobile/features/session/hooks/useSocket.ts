import type { ApiError } from '@cityborn/api';
import { useError } from '@cityborn/client';

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
      if (!mounted) return;

      socketRef.current = socket;

      if (!socket.connected) {
        socket.connect();
      }

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('disconnect', () => {
        setHasDisconnected(true);
        setConnected(false);
      });

      socket.on('connect_error', (error: Error) => {
        setHasDisconnected(false);
        invokeError(error.message);
      });

      socket.on('error', (error: ApiError) => {
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
    };
  }, [invokeError]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    const lastArg = args[args.length - 1];
    const hasCallback = typeof lastArg === 'function';

    if (hasCallback) {
      const callback = args.pop();
      socketRef.current?.emit(event, ...args, callback);
    } else {
      socketRef.current?.emit(event, ...args);
    }
  }, []);

  const on = useCallback(<T>(event: string, callback: (arg: T) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback(<T>(event: string, callback: (arg: T) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

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
