import type {
  User,
  VisitorId,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';

export interface AppSocketData {
  user: User | null;
  visitorId: VisitorId | undefined;
}

export type AppSocket = Socket<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  AppSocketData
>;

export type AppServer = Server<
  WsClientToServerEvents,
  WsServerToClientEvents,
  DefaultEventsMap,
  AppSocketData
>;
