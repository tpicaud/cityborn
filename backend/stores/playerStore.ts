import Redis from "ioredis";

export class PlayerStore {
    private redis: Redis;

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
        return result;
    }


    async delete(socketID: string): Promise<void> {
        await this.redis.del(this.key(socketID));
    }
}
