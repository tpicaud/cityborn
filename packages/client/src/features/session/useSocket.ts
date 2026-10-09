'use client';

import { WS_ERROR_EVENT } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import type {
  SocketConnection,
  SocketListenEvent,
  SocketListenEvents,
} from '../../ws/socketConnection';
import type { SocketFactory } from '../../ws/socketFactory';
import {
  superviseWsConnection,
  type WsConnection,
  type WsConnectionStatus,
} from '../../ws/wsConnection';
import { createWsEmit, type WsEmit } from '../../ws/wsEmit';
import { refreshCurrentUser } from '../auth/api/authQueries';

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
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  emit: WsEmit;
  on: <Name extends SocketListenEvent>(
    event: Name,
    listener: SocketListenEvents[Name],
  ) => void;
  off: <Name extends SocketListenEvent>(
    event: Name,
    listener: SocketListenEvents[Name],
  ) => void;
};

const CONNECTION_FAILED_MESSAGE = 'La connexion au serveur a échoué';

export function useSocket({
  createSocket,
  restoreSession,
}: SessionSocketOptions): SessionSocket {
  const [socket, setSocket] = useState<SocketConnection | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<WsConnectionStatus>('connecting');
  const retryConnectionRef: RefObject<() => void> = useRef<() => void>(
    () => {},
  );

  const { invokeError } = useError();
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();

  const refreshAuthentication = async (): Promise<void> => {
    await refreshCurrentUser({ queryClient, authApi });
  };

  const callbacks: RefObject<SessionSocketCallbacks> =
    useRef<SessionSocketCallbacks>({
      restoreSession,
      refreshAuthentication,
      invokeError,
    });

  useEffect(() => {
    callbacks.current = {
      restoreSession,
      refreshAuthentication,
      invokeError,
    };
  });

  useEffect(() => {
    let mounted = true;
    let openedSocket: SocketConnection | null = null;
    let wsConnection: WsConnection | null = null;

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

          const supervisedConnection: WsConnection = superviseWsConnection(
            createdSocket,
            {
              restoreChannels: (emit) => callbacks.current.restoreSession(emit),
              refreshAuthentication: () =>
                callbacks.current.refreshAuthentication(),
              onStatusChange: setConnectionStatus,
              onFailure: (error) =>
                callbacks.current.invokeError(error, CONNECTION_FAILED_MESSAGE),
            },
          );

          wsConnection = supervisedConnection;
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
      wsConnection?.close();

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
      listener: SocketListenEvents[Name],
    ) => {
      socket?.off(event, listener);
    },
    [socket],
  );

  return { connectionStatus, retryConnection, emit, on, off };
}
