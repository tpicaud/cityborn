'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SocketConnection, SocketFactory } from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import type { SocketEmit } from './socketRequest';

export interface SessionSocket {
  connected: boolean;
  hasDisconnected: boolean;
  emit: SocketEmit;
  on: <Args extends unknown[]>(
    event: string,
    listener: (...args: Args) => void,
  ) => void;
  off: <Args extends unknown[]>(
    event: string,
    listener: (...args: Args) => void,
  ) => void;
}

/**
 * La connexion est tenue en state et non en ref : la factory étant asynchrone,
 * les abonnements des hooks appelants doivent être rejoués une fois la socket
 * ouverte, ce qu'un changement d'identité de `on` / `off` déclenche.
 */
export function useSocket(createSocket: SocketFactory): SessionSocket {
  const [socket, setSocket] = useState<SocketConnection | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  const { invokeError } = useError();

  useEffect(() => {
    let mounted = true;
    let openedSocket: SocketConnection | null = null;

    createSocket().then((socket) => {
      if (!mounted) return socket.disconnect();

      openedSocket = socket;

      socket.on('connect', () => setConnected(true));

      socket.on('disconnect', () => {
        setHasDisconnected(true);
        setConnected(false);
      });

      socket.on('connect_error', (error: unknown) => {
        setHasDisconnected(false);
        invokeError(error, 'La connexion au serveur a échoué');
      });

      socket.on('error', (error: unknown) => {
        invokeError(error, 'Une erreur est survenue');
      });

      if (!socket.connected) socket.connect();

      setConnected(socket.connected);
      setSocket(socket);
    });

    return () => {
      mounted = false;

      if (!openedSocket) return;

      openedSocket.off('connect');
      openedSocket.off('disconnect');
      openedSocket.off('connect_error');
      openedSocket.off('error');
      openedSocket.disconnect();

      setSocket(null);
      setConnected(false);
    };
  }, [createSocket, invokeError]);

  const emit = useCallback<SocketEmit>(
    (event, ...args) => {
      const lastArg = args[args.length - 1];

      if (typeof lastArg === 'function') {
        const callback = args.pop();
        return socket?.emit(event, ...args, callback);
      }

      socket?.emit(event, ...args);
    },
    [socket],
  );

  const on = useCallback(
    <Args extends unknown[]>(
      event: string,
      listener: (...args: Args) => void,
    ) => {
      socket?.on(event, listener);
    },
    [socket],
  );

  const off = useCallback(
    <Args extends unknown[]>(
      event: string,
      listener: (...args: Args) => void,
    ) => {
      socket?.off(event, listener);
    },
    [socket],
  );

  return { connected, hasDisconnected, emit, on, off };
}
