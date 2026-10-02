import { ErrorCode, isApiError } from '@cityborn/api';
import type { SocketConnectError, SocketConnection } from './socketConnection';
import { createWsEmit, type WsEmit } from './wsEmit';

export type WsConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed';

export type WsConnectionOptions = {
  restoreChannels: (emit: WsEmit) => Promise<void>;
  refreshAuthentication: () => Promise<void>;
  onStatusChange: (status: WsConnectionStatus) => void;
  onFailure: (error: unknown) => void;
};

export type WsConnection = {
  retry: () => void;
  close: () => void;
};

const authenticationRejectionCodes: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.TOKEN_EXPIRED,
  ErrorCode.USER_INVALID_TOKEN,
]);

function connectErrorCause(error: SocketConnectError): unknown {
  return isApiError(error.data) ? error.data : error;
}

function isAuthenticationRejection(error: SocketConnectError): boolean {
  return (
    isApiError(error.data) && authenticationRejectionCodes.has(error.data.code)
  );
}

export function superviseWsConnection(
  socket: SocketConnection,
  options: WsConnectionOptions,
): WsConnection {
  const emit: WsEmit = createWsEmit(socket);
  let hasConnected = false;
  let authenticationRefreshed = false;
  let connectionGeneration = 0;
  let lastConnectError: unknown;
  let stopped = false;

  const pendingStatus = (): WsConnectionStatus =>
    hasConnected ? 'reconnecting' : 'connecting';

  const fail = (error: unknown): void => {
    if (stopped) return;
    options.onStatusChange('closed');
    options.onFailure(error);
  };

  const handleConnect = (): void => {
    hasConnected = true;
    connectionGeneration += 1;
    const generation: number = connectionGeneration;
    const isCurrentConnection = (): boolean =>
      !stopped && generation === connectionGeneration;

    options.restoreChannels(emit).then(
      () => {
        if (!isCurrentConnection()) return;
        authenticationRefreshed = false;
        options.onStatusChange('connected');
      },
      (error: unknown) => {
        if (!isCurrentConnection()) return;
        fail(error);
      },
    );
  };

  const handleDisconnect = (): void => {
    connectionGeneration += 1;
    options.onStatusChange('reconnecting');
    if (!socket.active) socket.connect();
  };

  const handleConnectError = (error: SocketConnectError): void => {
    lastConnectError = connectErrorCause(error);
    if (socket.active) return;

    if (!isAuthenticationRejection(error) || authenticationRefreshed) {
      fail(lastConnectError);
      return;
    }

    authenticationRefreshed = true;
    options.refreshAuthentication().then(() => {
      if (!stopped) socket.connect();
    }, fail);
  };

  const connect = (): void => {
    if (!socket.connected) {
      socket.connect();
      return;
    }
    handleConnect();
  };

  const handleReconnectAttempt = (): void => {
    options.onStatusChange(pendingStatus());
  };

  const handleReconnectFailed = (): void => {
    fail(lastConnectError);
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);
  socket.onReconnection('reconnect_attempt', handleReconnectAttempt);
  socket.onReconnection('reconnect_failed', handleReconnectFailed);

  options.onStatusChange('connecting');
  connect();

  return {
    retry: () => {
      authenticationRefreshed = false;
      options.onStatusChange(pendingStatus());
      connect();
    },

    close: () => {
      stopped = true;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.offReconnection('reconnect_attempt', handleReconnectAttempt);
      socket.offReconnection('reconnect_failed', handleReconnectFailed);
      socket.disconnect();
    },
  };
}
