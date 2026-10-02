'use client';

import { WS_ERROR_EVENT } from '@cityborn/api';
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  SocketConnection,
  SocketFactory,
  SocketListenEvent,
  SocketListenEvents,
} from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import { createWsEmit, type WsEmit } from '../../ws/wsEmit';
import { useAuth } from '../auth';
import {
  type SessionConnection,
  type SessionConnectionStatus,
  superviseSessionConnection,
} from './sessionConnection';

type SessionSocketOptions = {
  createSocket: SocketFactory;
  restoreSession: (emit: WsEmit) => Promise<void>;
};

type SessionSocketCallbacks = {
  restoreSession: (emit: WsEmit) => Promise<void>;
  refreshAuthentication: () => Promise<void>;
  invokeError: (error: unknown, fallbackMessage?: string) => void;
};

export type SessionSocket = {
  connectionStatus: SessionConnectionStatus;
  retryConnection: () => void;
  emit: WsEmit;
  on: <Name extends SocketListenEvent>(
    event: Name,
    listener: SocketListenEvents[Name],
  ) => void;
  off: <Name extends SocketListenEvent>(
    event: Name,
    listener?: SocketListenEvents[Name],
  ) => void;
};

const CONNECTION_FAILED_MESSAGE = 'La connexion au serveur a échoué';

export function useSocket({
  createSocket,
  restoreSession,
}: SessionSocketOptions): SessionSocket {
  const [socket, setSocket] = useState<SocketConnection | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<SessionConnectionStatus>('connecting');
  const retryConnectionRef: RefObject<() => void> = useRef<() => void>(
    () => {},
  );

  const { invokeError } = useError();
  const { refreshUser } = useAuth();

  const callbacks: RefObject<SessionSocketCallbacks> =
    useRef<SessionSocketCallbacks>({
      restoreSession,
      refreshAuthentication: refreshUser,
      invokeError,
    });

  useEffect(() => {
    callbacks.current = {
      restoreSession,
      refreshAuthentication: refreshUser,
      invokeError,
    };
  });

  useEffect(() => {
    let mounted = true;
    let openedSocket: SocketConnection | null = null;
    let sessionConnection: SessionConnection | null = null;

    const handleWsError: SocketListenEvents[typeof WS_ERROR_EVENT] = (
      error,
    ) => {
      callbacks.current.invokeError(error, 'Une erreur est survenue');
    };

    const openSocket = (): void => {
      setConnectionStatus('connecting');

      createSocket()
        .then((createdSocket: SocketConnection) => {
          if (!mounted) return createdSocket.disconnect();

          openedSocket = createdSocket;
          createdSocket.on(WS_ERROR_EVENT, handleWsError);

          const supervisedConnection: SessionConnection =
            superviseSessionConnection(createdSocket, {
              restoreSession: (emit) => callbacks.current.restoreSession(emit),
              refreshAuthentication: () =>
                callbacks.current.refreshAuthentication(),
              onStatusChange: setConnectionStatus,
              onFailure: (error) =>
                callbacks.current.invokeError(error, CONNECTION_FAILED_MESSAGE),
            });

          sessionConnection = supervisedConnection;
          retryConnectionRef.current = supervisedConnection.retry;
          setSocket(createdSocket);
        })
        .catch((error: unknown) => {
          if (!mounted) return;
          retryConnectionRef.current = openSocket;
          setConnectionStatus('closed');
          callbacks.current.invokeError(error, CONNECTION_FAILED_MESSAGE);
        });
    };

    openSocket();

    return () => {
      mounted = false;
      retryConnectionRef.current = () => {};

      openedSocket?.off(WS_ERROR_EVENT, handleWsError);
      sessionConnection?.close();

      setSocket(null);
    };
  }, [createSocket]);

  const retryConnection = useCallback(() => {
    retryConnectionRef.current();
  }, []);

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

  return { connectionStatus, retryConnection, emit, on, off };
}
