import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import Redlock from 'redlock';
import { WideEventService } from '../common/wide-event/wide-event.service';

@Injectable()
export class LockService {
  private redlock: Redlock;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly wideEventService: WideEventService,
  ) {
    this.redlock = new Redlock([this.redisClient], {
      retryCount: 3,
      retryDelay: 100,
    });

    this.redlock.on('clientError', (err) => {
      this.wideEventService.recordOperationError(err, {
        domain: 'infrastructure',
        operation: 'redlock.client',
      });
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
}
