'use client';

import { WS_ERROR_EVENT } from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  SocketConnection,
  SocketFactory,
  SocketListenEvent,
  SocketListenEvents,
} from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import { createWsEmit, type WsEmit } from '../../ws/wsEmit';

export interface SessionSocket {
  connected: boolean;
  hasDisconnected: boolean;
  emit: WsEmit;
  on: <Name extends SocketListenEvent>(
    event: Name,
    listener: SocketListenEvents[Name],
  ) => void;
  off: <Name extends SocketListenEvent>(
    event: Name,
    listener?: SocketListenEvents[Name],
  ) => void;
}

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

      socket.on('connect_error', (error) => {
        setHasDisconnected(false);
        invokeError(error, 'La connexion au serveur a échoué');
      });

      socket.on(WS_ERROR_EVENT, (error) => {
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
      openedSocket.off(WS_ERROR_EVENT);
      openedSocket.disconnect();

      setSocket(null);
      setConnected(false);
    };
  }, [createSocket, invokeError]);

  const emit: WsEmit = useMemo(() => createWsEmit(socket), [socket]);

  const on = useCallback(
    <Name extends SocketListenEvent>(
      event: Name,
      listener: SocketListenEvents[Name],
    ) => {
      socket?.on(event, listener);
    },
    [socket],
  );

  const off = useCallback(
    <Name extends SocketListenEvent>(
      event: Name,
      listener?: SocketListenEvents[Name],
    ) => {
      socket?.off(event, listener);
    },
    [socket],
  );

  return { connected, hasDisconnected, emit, on, off };
}
