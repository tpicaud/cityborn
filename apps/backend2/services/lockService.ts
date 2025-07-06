import Redlock from 'redlock';
import Redis from 'ioredis';

export class LockService {
  private redlock: Redlock;

  constructor(redisClient: Redis) {
    this.redlock = new Redlock([redisClient], {
      retryCount: 11,
      retryDelay: 200,
      retryJitter: 100,
    });
  }

  private resourceKey(resource: string): string {
    return `lock:${resource}`
;  }

  async withLock<T>(resource: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const resourceKey = this.resourceKey(resource);
    const lock = await this.redlock.acquire([resourceKey], ttl);
    try {
      return await fn();
    } finally {
      await lock.release().catch(() => {
        console.warn(`Le verrou ${resource} a déjà été relâché ou expiré.`);
      });
    }
  }

  // Optionnel : méthodes manuelles
  async acquire(resource: string, ttl: number) {
    const resourceKey = this.resourceKey(resource);
    return this.redlock.acquire([resource], ttl);
  }

  async release(lock: Awaited<ReturnType<LockService['acquire']>>) {
    return lock.release();
  }
}
