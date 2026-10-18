'use client';

import { WS_ERROR_EVENT } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { refreshCurrentUser } from '../../domains/auth/authQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type {
  SocketConnection,
  SocketListenEvents,
} from '../../ws/socketConnection';
import type { SocketFactory } from '../../ws/socketFactory';
import {
  superviseWsConnection,
  type WsConnection,
  type WsConnectionStatus,
} from '../../ws/wsConnection';

type SessionSocketOptions = {
  createSocket: SocketFactory;
  restoreSession: (socket: SocketConnection) => Promise<void>;
};

type SessionSocketCallbacks = {
  restoreSession: (socket: SocketConnection) => Promise<void>;
  refreshAuthentication: () => Promise<void>;
  reportError: (error: unknown, fallbackMessage?: string) => void;
};

export type SessionSocket = {
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  socket: SocketConnection | null;
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

  const { reportError }: ErrorReporter = useErrorReporter();
  const { authApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();

  const refreshAuthentication = async (): Promise<void> => {
    await refreshCurrentUser({ queryClient, authApi });
  };

  const callbacks: RefObject<SessionSocketCallbacks> =
    useRef<SessionSocketCallbacks>({
      restoreSession,
      refreshAuthentication,
      reportError,
    });

  useEffect(() => {
    callbacks.current = {
      restoreSession,
      refreshAuthentication,
      reportError,
    };
  });

  useEffect(() => {
    let mounted = true;
    let openedSocket: SocketConnection | null = null;
    let wsConnection: WsConnection | null = null;

    const handleWsError: SocketListenEvents[typeof WS_ERROR_EVENT] = (
      error,
    ) => {
      callbacks.current.reportError(error, 'Une erreur est survenue');
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
              restoreChannels: () =>
                callbacks.current.restoreSession(createdSocket),
              refreshAuthentication: () =>
                callbacks.current.refreshAuthentication(),
              onStatusChange: setConnectionStatus,
              onFailure: (error) =>
                callbacks.current.reportError(error, CONNECTION_FAILED_MESSAGE),
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
          callbacks.current.reportError(error, CONNECTION_FAILED_MESSAGE);
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

  return { connectionStatus, retryConnection, socket };
}
