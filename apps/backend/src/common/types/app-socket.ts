import type {
  PlayerId,
  SessionId,
  VisitorId,
  WsClientToServerEvents,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';
import type { AuthSession } from './auth-session';

export type SocketPlayer = {
  sessionID: SessionId;
  playerID: PlayerId;
};

export type AppSocketData = {
  authSession: AuthSession | null;
  visitorId: VisitorId | undefined;
  player: SocketPlayer | null;
};

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
