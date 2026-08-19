import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface ConnectionInfo {
  playerID: string;
  sessionID: string;
  isGuest: boolean;
}

@Injectable()
export class ConnectionRegistryService {
  private readonly prefix = 'connection:';
  private readonly CONNECTION_TTL = 3600;

  constructor(private readonly redisService: RedisService) {}

  private getKey(socketID: string): string {
    return `${this.prefix}${socketID}`;
  }

  async register(
    socketID: string,
    playerID: string,
    sessionID: string,
    isGuest: boolean,
  ) {
    const connectionInfo: ConnectionInfo = { playerID, sessionID, isGuest };
    await this.redisService.setJSON(
      this.getKey(socketID),
      connectionInfo,
      this.CONNECTION_TTL,
    );
  }

  async getConnection(socketID: string): Promise<ConnectionInfo | null> {
    const key = this.getKey(socketID);
    const connectionInfo = await this.redisService.getJSON<ConnectionInfo>(key);
    if (!connectionInfo) return null;

    await this.redisService.expire(key, this.CONNECTION_TTL);

    return connectionInfo;
  }

  async unregister(socketID: string) {
    await this.redisService.del(this.getKey(socketID));
  }
}
