import type {
  User,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

export interface SessionSocketData {
  user?: User | null;
  visitorId?: string | string[];
}

interface SessionSocketLifecycle {
  connectionSettled?: Promise<void>;
}

export type SessionSocket = Socket<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  SessionSocketData
> &
  SessionSocketLifecycle;

export type SessionServer = Server<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  SessionSocketData
>;
