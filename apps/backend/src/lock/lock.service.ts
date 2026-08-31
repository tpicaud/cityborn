import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class LockService implements OnModuleDestroy {
  private readonly logger = new Logger(LockService.name);
  private redlock: Redlock;

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
    this.redlock = new Redlock([this.redisClient], {
      retryCount: 3,
      retryDelay: 100,
    });

    this.redlock.on('clientError', (err) => {
      this.logger.error('A Redis client error occurred:', err);
    });
  }

  private resourceKey(resource: string): string {
    return `lock:${resource}`;
  }

  async withLock<T>(
    resource: string,
    ttl: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const resourceKey = this.resourceKey(resource);
    const lock = await this.redlock.acquire([resourceKey], ttl);

    try {
      return await callback();
    } finally {
      await lock.release();
    }
  }

  async onModuleDestroy() {
    await this.redlock.quit();
  }
}
