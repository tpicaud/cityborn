import {
  ErrorCode,
  type UserId,
  type WsServerToClientEvents,
} from '@cityborn/api';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { RemoteSocket } from 'socket.io';
import type {
  AppServer,
  AppSocket,
  AppSocketData,
  SocketAuthentication,
} from '../common/types/app-socket';
import type { SessionVersion } from '../common/types/authentication';

function userAuthenticationRoom(userId: UserId): string {
  return `auth:user:${userId}`;
}

function getSocketSessionVersion(
  authentication: SocketAuthentication,
): SessionVersion | null {
  if (authentication.status === 'anonymous') return null;
  return authentication.sessionVersion;
}

@Injectable()
export class AuthenticatedSocketService {
  private server: AppServer | null = null;

  registerServer(server: AppServer): void {
    this.server = server;
  }

  async joinUserRoom(socket: AppSocket, userId: UserId): Promise<void> {
    await socket.join(userAuthenticationRoom(userId));
  }

  async disconnectOlderSessions(
    userId: UserId,
    currentSessionVersion: SessionVersion,
  ): Promise<void> {
    const server: AppServer = this.requireServer();
    const sockets: RemoteSocket<WsServerToClientEvents, AppSocketData>[] =
      await server.in(userAuthenticationRoom(userId)).fetchSockets();

    for (const socket of sockets) {
      const socketSessionVersion: SessionVersion | null =
        getSocketSessionVersion(socket.data.authentication);
      if (
        socketSessionVersion !== null &&
        socketSessionVersion < currentSessionVersion
      ) {
        socket.disconnect(true);
      }
    }
  }

  private requireServer(): AppServer {
    if (this.server) return this.server;

    throw new InternalServerErrorException({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Socket.IO server is not initialized',
    });
  }
}
