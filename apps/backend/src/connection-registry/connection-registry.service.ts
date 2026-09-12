import { PlayerIdSchema, SessionIdSchema } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { RedisService } from '../redis/redis.service';

const ConnectionInfoSchema = z.object({
  playerID: PlayerIdSchema,
  sessionID: SessionIdSchema,
  isGuest: z.boolean(),
});

export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;

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
    playerID: ConnectionInfo['playerID'],
    sessionID: ConnectionInfo['sessionID'],
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
    const storedConnectionInfo = await this.redisService.getJSON<unknown>(key);
    if (!storedConnectionInfo) return null;

    const connectionInfo = ConnectionInfoSchema.parse(storedConnectionInfo);

    await this.redisService.expire(key, this.CONNECTION_TTL);

    return connectionInfo;
  }

  async unregister(socketID: string) {
    await this.redisService.del(this.getKey(socketID));
  }
}
