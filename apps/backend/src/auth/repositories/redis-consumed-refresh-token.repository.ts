import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { ConsumedRefreshTokenRepository } from './consumed-refresh-token.repository';

const CONSUMED_REFRESH_TOKEN_KEY_PREFIX: string =
  'auth:consumed-refresh-token:';

@Injectable()
export class RedisConsumedRefreshTokenRepository
  implements ConsumedRefreshTokenRepository
{
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async consume({
    refreshTokenHash,
    expiresAt,
  }: {
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const remainingLifetimeSeconds: number = Math.max(
      Math.floor(expiresAt.getTime() / 1000) - Math.floor(Date.now() / 1000),
      1,
    );
    const reply: 'OK' | null = await this.redisClient.set(
      `${CONSUMED_REFRESH_TOKEN_KEY_PREFIX}${refreshTokenHash}`,
      '1',
      'EX',
      remainingLifetimeSeconds,
      'NX',
    );
    return reply === 'OK';
  }
}
