import {
  ErrorCode,
  type UserId,
  type WsServerToClientEvents,
} from '@cityborn/api';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { RemoteSocket } from 'socket.io';
import type { AppServer, AppSocketData } from '../common/types/app-socket';
import type {
  SessionVersion,
  SocketAuthentication,
} from '../common/types/authentication';
import { UserService } from '../user/user.service';

export function userAuthenticationRoom(userId: UserId): string {
  return `auth:user:${userId}`;
}

function getSocketSessionVersion(
  authentication: SocketAuthentication,
): SessionVersion | null {
  if (authentication.status === 'anonymous') return null;
  return authentication.sessionVersion;
}

@Injectable()
export class SessionRevocationService {
  private server: AppServer | null = null;

  constructor(private readonly userService: UserService) {}

  registerServer(server: AppServer): void {
    this.server = server;
  }

  async rotateSessionVersion(userId: UserId): Promise<SessionVersion> {
    this.requireServer();
    const sessionVersion: SessionVersion =
      await this.userService.incrementSessionVersion(userId);
    await this.disconnectOlderSessions(userId, sessionVersion);
    return sessionVersion;
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
