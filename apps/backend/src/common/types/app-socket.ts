import type {
  VisitorId,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';
import type { AuthSession } from './auth-session';

export interface AppSocketData {
  authSession: AuthSession | null;
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
