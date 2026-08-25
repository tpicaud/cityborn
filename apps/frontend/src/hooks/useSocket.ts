import { isApiError } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

export const useSocket = () => {
  const socket: Socket = getSocket();
  const [connected, setConnected] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  const { invokeError } = useError();

  useEffect(() => {
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

    socket.on('connect_error', (error: unknown) => {
      setHasDisconnected(false);
      invokeError(
        isApiError(error) ? error : 'La connexion au serveur a échoué',
      );
    });

    socket.on('error', (error: unknown) => {
      invokeError(isApiError(error) ? error : 'Une erreur est survenue');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
      socket.disconnect();
    };
  }, [socket, invokeError]);

  const emit = useCallback(
    (event: string, ...args: unknown[]) => {
      const lastArg = args[args.length - 1];
      const hasCallback = typeof lastArg === 'function';

      if (hasCallback) {
        const callback = args.pop();
        socket.emit(event, ...args, callback);
      } else {
        socket.emit(event, ...args);
      }
    },
    [socket.emit],
  );

  const on = useCallback(
    <Args extends unknown[]>(
      event: string,
      callback: (...args: Args) => void,
    ) => {
      socket.on(event, callback);
    },
    [socket.on],
  );

  const off = useCallback(
    <Args extends unknown[]>(
      event: string,
      callback: (...args: Args) => void,
    ) => {
      socket.off(event, callback);
    },
    [socket.off],
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
