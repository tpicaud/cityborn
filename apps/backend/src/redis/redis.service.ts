import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject('REDIS_CLIENT') readonly redisClient: Redis,
    ) { }

    async set(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds) {
            await this.redisClient.set(key, value, 'EX', ttlSeconds);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return await this.redisClient.get(key);
    }

    async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        await this.set(key, serialized, ttlSeconds);
    }

    async getJSON<T>(key: string): Promise<T | null> {
        const raw = await this.get(key);
        return raw ? JSON.parse(raw) as T : null;
    }

    async del(key: string): Promise<number> {
        return this.redisClient.del(key);
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }
}
