// lock.service.ts
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class LockService implements OnModuleDestroy {
    private redlock: Redlock;

    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
        this.redlock = new Redlock([this.redisClient], {
            retryCount: 10,
            retryDelay: 200,
        });

        this.redlock.on('clientError', (err) => {
            console.error('A Redis client error occurred:', err);
        });
    }

    /**
     * Exécute une fonction avec un verrou Redis sur une ressource.
     */
    async withLock<T>(
        resource: string,
        ttl: number,
        callback: () => Promise<T>,
    ): Promise<T> {
        const lock = await this.redlock.acquire([resource], ttl);

        try {
            return await callback();
        } finally {
            await lock.release();
        }
    }

    async onModuleDestroy() {
        await this.redlock.quit(); // Libère proprement le redlock
    }
}
