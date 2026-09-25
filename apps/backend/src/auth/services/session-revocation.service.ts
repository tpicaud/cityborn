import type { UserId } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import type { SessionServer } from '../../common/types/session-socket';

export function userSessionRoom(userId: UserId): string {
  return `auth:user:${userId}`;
}

@Injectable()
export class SessionRevocationService {
  private server?: SessionServer;

  registerServer(server: SessionServer): void {
    this.server = server;
  }

  async disconnectOlderSessions(
    userId: UserId,
    sessionVersion: number,
  ): Promise<void> {
    if (!this.server) return;
    const sockets = await this.server
      .in(userSessionRoom(userId))
      .fetchSockets();
    for (const socket of sockets) {
      if ((socket.data.sessionVersion ?? 0) < sessionVersion)
        socket.disconnect(true);
    }
  }
}
