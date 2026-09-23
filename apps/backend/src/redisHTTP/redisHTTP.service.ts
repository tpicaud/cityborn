import { Inject, Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { REDIS_CONFIG, type RedisConfig } from '../config/config.module';

@Injectable()
export class RedisHTTPService {
  private readonly redisHTTPClient: Redis;

  constructor(@Inject(REDIS_CONFIG) redisConfig: RedisConfig) {
    const { restUrl, restToken } = redisConfig;
    if (!restUrl || !restToken) {
      throw new Error('Upstash REST configuration is required');
    }
    this.redisHTTPClient = new Redis({
      url: restUrl,
      token: restToken,
    });
  }

  async getHTTP<T = unknown>(key: string): Promise<T | null> {
    return await this.redisHTTPClient.get<T>(key);
  }

  async setHTTP<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
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
