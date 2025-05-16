import Redis from "ioredis";

export class PlayerStore {
    private redis: Redis;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    private key(socketID: string) {
        return `socket:${socketID}`;
    }

    async set(socketID: string, playerID: string, sessionID: string): Promise<void> {
        // hmset est déprécié, mieux vaut utiliser hset
        await this.redis.hset(this.key(socketID), { playerID, sessionID });
    }

    async get(socketID: string): Promise<{ playerID: string; sessionID: string } | null> {
        const data = await this.redis.hgetall(this.key(socketID));
        if (Object.keys(data).length === 0) {
            return null; // clé non trouvée
        }
        return {
            playerID: data.playerID,
            sessionID: data.sessionID,
        };
    }

    async delete(socketID: string): Promise<void> {
        await this.redis.del(this.key(socketID));
    }
}
