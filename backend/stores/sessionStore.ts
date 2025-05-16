import Redis from "ioredis";

export class SessionStore {

    private redis: Redis;
    private SESSION_TTL = 900 // 15 min

    constructor(redis: Redis) {
        this.redis = redis;
    }

    private key(sessionID: string) {
        return `session:${sessionID}`;
    }

    async saveSession(session: any) {
        const key = this.key(session.id);
        const value = JSON.stringify(session);

        if (session.currentGameId) {
            await this.redis.set(key, value); // Pas de TTL car game en cours
        } else {
            await this.redis.set(key, value, 'EX', this.SESSION_TTL); // TTL appliqué sinon
        }
    }

    async getSession(sessionID: string) {
        const data = await this.redis.get(this.key(sessionID));
		return data ? JSON.parse(data) : null;
    }

    async deleteSession(sessionID: string) {
        await this.redis.del(this.key(sessionID));
    }
}