import Redis from "ioredis";

export class PlayerStore {
    private redis: Redis;
    private readonly PLAYER_TTL = 3600;
    private readonly SESSION_TTL = 900;
    private readonly GAME_TTL = 900;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    private key(socketID: string) {
        return `socket:${socketID}`;
    }

    async set(socketID: string, playerID: string, sessionID: string, gameID?: string): Promise<void> {
        const data: Record<string, string> = { playerID, sessionID };
        if (gameID !== undefined) {
            data.gameID = gameID;
        }
        await this.redis.hset(this.key(socketID), data);
        await this.redis.expire(this.key(socketID), this.PLAYER_TTL);
    }


    async get(socketID: string): Promise<{ playerID: string; sessionID: string; gameID?: string } | null> {
        const data = await this.redis.hgetall(this.key(socketID));
        if (Object.keys(data).length === 0) {
            return null;
        }

        const result: { playerID: string; sessionID: string; gameID?: string } = {
            playerID: data.playerID,
            sessionID: data.sessionID
        };

        if (data.gameID !== undefined) {
            result.gameID = data.gameID;
        }

        // reset ttl
        await this.resetTTL(socketID, data.sessionID, data.gameID);

        return result;
    }


    async delete(socketID: string): Promise<void> {
        await this.redis.del(this.key(socketID));
    }

    private async resetTTL(socketID: string, sessionID: string, gameID?: string): Promise<void> {
        await this.redis.expire(this.key(socketID), this.PLAYER_TTL);
        await this.redis.expire(`session:${sessionID}`, this.SESSION_TTL);
        if (gameID) await this.redis.expire(`game:${gameID}`, this.GAME_TTL);
    }
}
