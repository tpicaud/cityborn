import Redis from "ioredis";

export class SocketStore {

    private redis: Redis;
    private readonly indexKey = 'socket:index';

    constructor(redis: Redis) {
        this.redis = redis;
    }

    private compositeKey(playerID: string, sessionID: string) {
        return `${playerID}:${sessionID}`;
    }

    async set(socketID: string, playerID: string, sessionID: string) {
        const key = this.compositeKey(playerID, sessionID);
        await this.redis.hset(this.indexKey, key, socketID);
    }

    async get(playerID: string, sessionID: string): Promise<string | null> {
        const key = this.compositeKey(playerID, sessionID);
        return await this.redis.hget(this.indexKey, key);
    }

    async delete(playerID: string, sessionID: string) {
        const key = this.compositeKey(playerID, sessionID);
        await this.redis.hdel(this.indexKey, key);
    }
}
