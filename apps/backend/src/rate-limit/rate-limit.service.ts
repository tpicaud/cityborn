import { Injectable } from '@nestjs/common';
import { RateLimiterRedis, type RateLimiterRes } from 'rate-limiter-flexible';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly passwordResetLimiter: RateLimiterRedis;
  private readonly httpLimiter: RateLimiterRedis;
  private readonly wsConnectionLimiter: RateLimiterRedis;
  private readonly wsMessageLimiter: RateLimiterRedis;

  constructor(private readonly redisService: RedisService) {
    this.passwordResetLimiter = new RateLimiterRedis({
      storeClient: this.redisService.redisClient,
      keyPrefix: 'rl:password-reset:ip',
      points: 5,
      duration: 15 * 60,
    });
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
  }

  async consumePasswordReset(ip: string): Promise<RateLimiterRes> {
    return this.passwordResetLimiter.consume(ip);
  }

  async reservePasswordResetEmail(emailHash: string): Promise<boolean> {
    const result: 'OK' | null = await this.redisService.redisClient.set(
      `rl:password-reset:email:${emailHash}`,
      '1',
      'EX',
      180,
      'NX',
    );
    return result === 'OK';
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
}
