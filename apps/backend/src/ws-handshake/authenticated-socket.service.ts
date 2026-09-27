import { ErrorCode, type UserId } from '@cityborn/api';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { AppServer, AppSocket } from '../common/types/app-socket';
import type { AuthSession, SessionVersion } from '../common/types/auth-session';

function userSessionsRoom(userId: UserId): string {
  return `auth:user:${userId}`;
}

function userSessionVersionRoom(
  userId: UserId,
  sessionVersion: SessionVersion,
): string {
  return `${userSessionsRoom(userId)}:version:${sessionVersion}`;
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
      userSessionVersionRoom(userId, authSession.sessionVersion),
    ]);
  }

  disconnectOlderSessions(
    userId: UserId,
    currentSessionVersion: SessionVersion,
  ): void {
    this.requireServer()
      .in(userSessionsRoom(userId))
      .except(userSessionVersionRoom(userId, currentSessionVersion))
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
