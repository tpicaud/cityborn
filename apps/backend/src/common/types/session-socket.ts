import type {
  User,
  VisitorId,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

export interface SessionSocketData {
  user: User | null;
  visitorId: VisitorId | undefined;
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
