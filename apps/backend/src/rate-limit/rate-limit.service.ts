import { ErrorCode, type UserId } from '@cityborn/api';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RateLimiterRedis, type RateLimiterRes } from 'rate-limiter-flexible';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly httpLimiter: RateLimiterRedis;
  private readonly wsConnectionLimiter: RateLimiterRedis;
  private readonly wsMessageLimiter: RateLimiterRedis;
  private readonly failedSignInLimiter: RateLimiterRedis;

  constructor(private readonly redisService: RedisService) {
    this.httpLimiter = new RateLimiterRedis({
      storeClient: this.redisService.redisClient,
      keyPrefix: 'rl:http',
      points: 100,
      duration: 60,
    });
    this.wsConnectionLimiter = new RateLimiterRedis({
      storeClient: this.redisService.redisClient,
      keyPrefix: 'rl:ws:conn',
      points: 20,
      duration: 60,
    });
    this.wsMessageLimiter = new RateLimiterRedis({
      storeClient: this.redisService.redisClient,
      keyPrefix: 'rl:ws:msg',
      points: 50,
      duration: 10,
    });
    this.failedSignInLimiter = new RateLimiterRedis({
      storeClient: this.redisService.redisClient,
      keyPrefix: 'rl:auth:failed-sign-in',
      points: 10,
      duration: 15 * 60,
    });
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
