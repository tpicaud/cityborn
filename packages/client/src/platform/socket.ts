import type {
  WsClientEventName,
  WsEmitArgs,
  WsServerToClientEvents,
} from '@cityborn/api';

export type SocketConnectError = Error & { data?: unknown };

type SocketLifecycleEvents = {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: SocketConnectError) => void;
};

export type SocketListenEvents = WsServerToClientEvents & SocketLifecycleEvents;

export type SocketListenEvent = keyof SocketListenEvents;

export type SocketReconnectionEvent = 'reconnect_attempt' | 'reconnect_failed';

export interface SocketConnection {
  readonly connected: boolean;
  readonly active: boolean;
  connect(): void;
  disconnect(): void;
  emit<Name extends WsClientEventName>(
    event: Name,
    ...args: WsEmitArgs<Name>
  ): void;
  on<Name extends SocketListenEvent>(
    event: Name,
    listener: SocketListenEvents[Name],
  ): void;
  off<Name extends SocketListenEvent>(
    event: Name,
    listener?: SocketListenEvents[Name],
  ): void;
  onReconnection(event: SocketReconnectionEvent, listener: () => void): void;
  offReconnection(event: SocketReconnectionEvent, listener: () => void): void;
}

export type SocketFactory = () => Promise<SocketConnection>;
