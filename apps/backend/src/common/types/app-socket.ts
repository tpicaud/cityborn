import type {
  UserId,
  VisitorId,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';
import type { AuthenticationContext, SessionVersion } from './authentication';

export type SocketAuthentication =
  | { status: 'anonymous' }
  | {
      status: 'pending';
      userId: UserId;
      sessionVersion: SessionVersion;
    }
  | ({ status: 'authenticated' } & AuthenticationContext);

export interface AppSocketData {
  authentication: SocketAuthentication;
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
