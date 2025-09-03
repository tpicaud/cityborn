import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PlayerService {

    private readonly prefix = 'socket:';
    private readonly PLAYER_TTL = 3600;
    private readonly SESSION_TTL = 900;
    private readonly GAME_TTL = 900;

    constructor(
        private readonly redisService: RedisService,
    ) { }

    private getKey(socketID: string): string {
        return `${this.prefix}${socketID}`;
    }

    async save(socketID: string, playerID: string, sessionID: string) {
        try {
            const data: Record<string, string> = { playerID, sessionID };

            await this.redisService.redisClient.hset(this.getKey(socketID), data);
            await this.redisService.redisClient.expire(this.getKey(socketID), this.PLAYER_TTL);
        } catch (error) {
            throw new InternalServerErrorException({ code: ErrorCode.REDIS_SET_FAILED, message: `Error saving player: ${error.message}` })
        }
    }

    async getPlayer(socketID: string): Promise<{ playerID: string; sessionID: string } | null> {
        try {
            const data = await this.redisService.redisClient.hgetall(this.getKey(socketID));
            if (Object.keys(data).length === 0) return null;

            const result: { playerID: string; sessionID: string } = {
                playerID: data.playerID,
                sessionID: data.sessionID
            };


            // reset ttl
            await this.redisService.redisClient.expire(this.getKey(socketID), this.PLAYER_TTL);

            return result;
        } catch (error) {
            throw new InternalServerErrorException({ code: ErrorCode.REDIS_GET_FAILED, message: `Error getting player: ${error.message}` })
        }
    }

    async deletePlayer(socketID: string) {
        await this.redisService.del(this.getKey(socketID));
    }
}
