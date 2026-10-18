'use client';

import { WS_ERROR_EVENT, type WsChannel } from '@cityborn/api';
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type ErrorReporter,
  type ReportError,
  useErrorReporter,
} from '../shared/errorReporter';
import type { SocketConnection, SocketListenEvents } from './socketConnection';
import type { SocketFactory } from './socketFactory';
import {
  toWsChannelConnection,
  type WsChannelConnection,
} from './wsChannelConnection';
import {
  superviseWsConnection,
  type WsConnectionStatus,
  type WsConnectionSupervision,
} from './wsConnection';
import { useSocketFactory } from './wsProvider';

export type WsChannelState<Channel> = {
  channel: Channel | null;
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
};

type WsChannelOptions<Channel> = {
  createChannel: (connection: WsChannelConnection<WsChannel>) => Channel;
  restoreChannel: (channel: Channel) => Promise<void>;
  refreshAuthentication: () => Promise<void>;
};

type WsChannelCallbacks<Channel> = WsChannelOptions<Channel> & {
  reportError: ReportError;
};

const CONNECTION_FAILED_MESSAGE = 'La connexion au serveur a échoué';

export function useWsChannel<Channel>({
  createChannel,
  restoreChannel,
  refreshAuthentication,
}: WsChannelOptions<Channel>): WsChannelState<Channel> {
  const createSocket: SocketFactory = useSocketFactory();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<WsConnectionStatus>('connecting');
  const retryConnectionRef: RefObject<() => void> = useRef<() => void>(
    () => {},
  );

  const { reportError }: ErrorReporter = useErrorReporter();

  const callbacks: RefObject<WsChannelCallbacks<Channel>> = useRef<
    WsChannelCallbacks<Channel>
  >({ createChannel, restoreChannel, refreshAuthentication, reportError });

  useEffect(() => {
    callbacks.current = {
      createChannel,
      restoreChannel,
      refreshAuthentication,
      reportError,
    };
  });

  useEffect(() => {
    let mounted = true;
    let openedSocket: SocketConnection | null = null;
    let supervision: WsConnectionSupervision | null = null;

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

          const openedChannel: Channel = callbacks.current.createChannel(
            toWsChannelConnection(createdSocket),
          );

          const createdSupervision: WsConnectionSupervision =
            superviseWsConnection({
              socket: createdSocket,
              restoreChannels: () =>
                callbacks.current.restoreChannel(openedChannel),
              refreshAuthentication: () =>
                callbacks.current.refreshAuthentication(),
              onStatusChange: setConnectionStatus,
              onFailure: (error) =>
                callbacks.current.reportError(error, CONNECTION_FAILED_MESSAGE),
            });

          supervision = createdSupervision;
          retryConnectionRef.current = createdSupervision.retry;
          setChannel(() => openedChannel);
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
      supervision?.close();

      setChannel(null);
    };
  }, [createSocket]);

  const retryConnection = useCallback(() => {
    retryConnectionRef.current();
  }, []);

  return { channel, connectionStatus, retryConnection };
}
