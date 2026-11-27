import { ErrorCode, type UserId } from '@cityborn/api';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { RateLimiterRedis, type RateLimiterRes } from 'rate-limiter-flexible';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class RateLimitService {
  private readonly passwordResetLimiter: RateLimiterRedis;
  private readonly httpLimiter: RateLimiterRedis;
  private readonly wsConnectionLimiter: RateLimiterRedis;
  private readonly wsMessageLimiter: RateLimiterRedis;
  private readonly failedSignInLimiter: RateLimiterRedis;
  private readonly emailChangeLimiter: RateLimiterRedis;

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    this.passwordResetLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:password-reset:ip',
      points: 5,
      duration: 15 * 60,
    });
    this.httpLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:http',
      points: 100,
      duration: 60,
    });
    this.wsConnectionLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:ws:conn',
      points: 20,
      duration: 60,
    });
    this.wsMessageLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:ws:msg',
      points: 50,
      duration: 10,
    });
    this.failedSignInLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:auth:failed-sign-in',
      points: 10,
      duration: 15 * 60,
    });
    this.emailChangeLimiter = new RateLimiterRedis({
      storeClient: this.redisClient,
      keyPrefix: 'rl:auth:email-change',
      points: 5,
      duration: 60 * 60,
    });
  }

  async consumePasswordReset(ip: string): Promise<RateLimiterRes> {
    return this.passwordResetLimiter.consume(ip);
  }

  async reservePasswordResetEmail(emailHash: string): Promise<boolean> {
    const reply: 'OK' | null = await this.redisClient.set(
      `rl:password-reset:email:${emailHash}`,
      '1',
      'EX',
      180,
      'NX',
    );
    return reply === 'OK';
  }

  async consumeHttp(key: string): Promise<RateLimiterRes> {
    return this.httpLimiter.consume(key);
  }

  async consumeWsConnection(key: string): Promise<RateLimiterRes> {
    return this.wsConnectionLimiter.consume(key);
  }

  async consumeWsMessage(key: string): Promise<RateLimiterRes> {
    return this.wsMessageLimiter.consume(key);
  }

  async consumeEmailChange(userId: UserId): Promise<void> {
    await this.emailChangeLimiter.consume(userId);
  }

  async assertSignInAllowed(userId: UserId): Promise<void> {
    const failedSignIns: RateLimiterRes | null =
      await this.failedSignInLimiter.get(userId);
    if (failedSignIns === null || failedSignIns.remainingPoints > 0) {
      return;
    }
    throw new HttpException(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many failed sign-in attempts',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async recordFailedSignIn(userId: UserId): Promise<void> {
    await this.failedSignInLimiter.penalty(userId);
  }

  async clearFailedSignIns(userId: UserId): Promise<void> {
    await this.failedSignInLimiter.delete(userId);
  }
}
