import { ErrorCode, type UserId } from '@cityborn/api';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { AppServer, AppSocket } from '../common/types/app-socket';
import type { AuthSession, AuthVersion } from '../common/types/auth-session';

function userSessionsRoom(userId: UserId): string {
  return `auth:user:${userId}`;
}

function userAuthVersionRoom(userId: UserId, authVersion: AuthVersion): string {
  return `${userSessionsRoom(userId)}:version:${authVersion}`;
}

@Injectable()
export class AuthenticatedSocketService {
  private server: AppServer | null = null;

  registerServer(server: AppServer): void {
    this.server = server;
  }

  async joinSessionRooms(
    socket: AppSocket,
    authSession: AuthSession,
  ): Promise<void> {
    const userId: UserId = authSession.user.id;
    await socket.join([
      userSessionsRoom(userId),
      userAuthVersionRoom(userId, authSession.authVersion),
    ]);
  }

  disconnectOlderSessions(
    userId: UserId,
    currentAuthVersion: AuthVersion,
  ): void {
    this.requireServer()
      .in(userSessionsRoom(userId))
      .except(userAuthVersionRoom(userId, currentAuthVersion))
      .disconnectSockets(true);
  }

  private requireServer(): AppServer {
    if (this.server) return this.server;

    throw new InternalServerErrorException({
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Socket.IO server is not initialized',
    });
  }
}
