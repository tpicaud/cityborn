import { Injectable } from '@nestjs/common';
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

    async save(socketID: string, playerID: string, sessionID: string, gameID?: string) {
        const data: Record<string, string> = { playerID, sessionID };
        if (gameID !== undefined) {
            data.gameID = gameID;
        }
        await this.redisService.redisClient.hset(this.getKey(socketID), data);
        await this.redisService.redisClient.expire(this.getKey(socketID), this.PLAYER_TTL);
    }

    async getPlayer(socketID: string): Promise<{ playerID: string; sessionID: string; gameID?: string } | null> {
        try {
            const data = await this.redisService.redisClient.hgetall(this.getKey(socketID));
            if (Object.keys(data).length === 0) return null;

            const result: { playerID: string; sessionID: string; gameID?: string } = {
                playerID: data.playerID,
                sessionID: data.sessionID
            };

            if (data.gameID !== undefined) result.gameID = data.gameID;

            // reset ttl
            await this.resetTTL(socketID, data.sessionID, data.gameID);

            return result;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du joueur associé au socket ${socketID}`);
        }
    }

    async deletePlayer(socketID: string) {
        try {
            await this.redisService.del(this.getKey(socketID));
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du joueur associé au socket ${socketID}`);
        }
    }

    private async resetTTL(socketID: string, sessionID: string, gameID?: string): Promise<void> {
        await this.redisService.redisClient.expire(this.getKey(socketID), this.PLAYER_TTL);
        await this.redisService.redisClient.expire(`session:${sessionID}`, this.SESSION_TTL);
        if (gameID) await this.redisService.redisClient.expire(`game:${gameID}`, this.GAME_TTL);
    }
}
