import type {
  WsClientEventName,
  WsEmitArgs,
  WsServerToClientEvents,
} from '@cityborn/api';

interface SocketLifecycleEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

export interface SocketListenEvents
  extends WsServerToClientEvents,
    SocketLifecycleEvents {}

export type SocketListenEvent = keyof SocketListenEvents;

export interface SocketConnection {
  readonly connected: boolean;
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
}

/**
 * Asynchrone car le mobile doit lire le token stocké avant d'ouvrir la socket,
 * là où le web s'authentifie par cookie et peut résoudre immédiatement.
 */
export type SocketFactory = () => Promise<SocketConnection>;
