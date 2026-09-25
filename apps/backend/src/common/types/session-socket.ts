import type {
  User,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

export interface SessionSocketData {
  sessionVersion?: number;
  user?: User | null;
  visitorId?: string | string[];
}

export type SessionSocket = Socket<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  SessionSocketData
>;

export type SessionServer = Server<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  SessionSocketData
>;
