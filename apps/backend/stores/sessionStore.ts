import Redis from "ioredis";

export class SessionStore {

    private redis: Redis;
    private SESSION_TTL = 900 // 15 min

    constructor(redis: Redis) {
        this.redis = redis;
    }

    key(sessionID: string) {
        return `session:${sessionID}`;
    }

    async saveSession(session: any) {
        const key = this.key(session.id);
        const value = JSON.stringify(session);
        await this.redis.set(key, value, 'EX', this.SESSION_TTL);
    }

    async getSession(sessionID: string) {
        const data = await this.redis.get(this.key(sessionID));
        return data ? JSON.parse(data) : null;
    }

    async deleteSession(sessionID: string) {
        await this.redis.del(this.key(sessionID));
    }
}