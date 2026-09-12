'use client';

import { useCallback, useEffect, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type {
  SocketConnection,
  SocketConnectionFactory,
} from '../../ports/socket';

export interface SessionSocket {
  isSocketConnected: boolean;
  hasDisconnected: boolean;
  emit: (event: string, ...args: unknown[]) => void;
  on: <Args extends unknown[]>(
    event: string,
    listener: (...args: Args) => void,
  ) => void;
  off: <Args extends unknown[]>(
    event: string,
    listener: (...args: Args) => void,
  ) => void;
}

export function useSessionSocket(
  connectSocket: SocketConnectionFactory,
): SessionSocket {
  const [connection, setConnection] = useState<SocketConnection | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);
  const { invokeError } = useError();

  useEffect(() => {
    let openedConnection: SocketConnection | null = null;
    let isMounted = true;

    connectSocket().then((socketConnection) => {
      if (!isMounted) {
        socketConnection.disconnect();
        return;
      }

      openedConnection = socketConnection;

      socketConnection.on('connect', () => setIsSocketConnected(true));
      socketConnection.on('disconnect', () => {
        setHasDisconnected(true);
        setIsSocketConnected(false);
      });
      socketConnection.on('connect_error', (error: unknown) => {
        setHasDisconnected(false);
        invokeError(error, 'La connexion au serveur a échoué');
      });
      socketConnection.on('error', (error: unknown) => {
        invokeError(error, 'Une erreur est survenue');
      });

      setConnection(socketConnection);

      if (socketConnection.connected) {
        setIsSocketConnected(true);
        return;
      }
      socketConnection.connect();
    });

    return () => {
      isMounted = false;
      setConnection(null);

      if (!openedConnection) return;
      openedConnection.off('connect');
      openedConnection.off('disconnect');
      openedConnection.off('connect_error');
      openedConnection.off('error');
      openedConnection.disconnect();
    };
  }, [connectSocket, invokeError]);

  const emit = useCallback(
    (event: string, ...args: unknown[]) => {
      connection?.emit(event, ...args);
    },
    [connection],
  );

  const on = useCallback(
    <Args extends unknown[]>(
      event: string,
      listener: (...args: Args) => void,
    ) => {
      connection?.on(event, listener);
    },
    [connection],
  );

  const off = useCallback(
    <Args extends unknown[]>(
      event: string,
      listener: (...args: Args) => void,
    ) => {
      connection?.off(event, listener);
    },
    [connection],
  );

  return { isSocketConnected, hasDisconnected, emit, on, off };
}
