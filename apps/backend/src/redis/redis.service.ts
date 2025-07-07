import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis'

@Injectable()
export class RedisService {
    private readonly redisHTTPClient: Redis

    constructor() {
        this.redisHTTPClient = new Redis({
            url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
            token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
        });
    }

    async getHTTP<T = any>(key: string): Promise<T | null> {
        return this.redisHTTPClient.get<T>(key);
    }

    async setHTTP<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.redisHTTPClient.set(key, value, { ex: ttlSeconds });
        } else {
            await this.redisHTTPClient.set(key, value);
        }
    }

    async delHTTP(key: string): Promise<void> {
        await this.redisHTTPClient.del(key);
    }
}
