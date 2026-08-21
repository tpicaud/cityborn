import { ErrorCode } from '@cityborn/api';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  private readonly httpLimiter: RateLimiterRedis;
  private readonly wsConnectionLimiter: RateLimiterRedis;
  private readonly wsMessageLimiter: RateLimiterRedis;

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
  }

  async consumeHttp(key: string): Promise<void> {
    await this.consume(this.httpLimiter, key);
  }

  async consumeWsConnection(key: string): Promise<void> {
    await this.consume(this.wsConnectionLimiter, key);
  }

  async consumeWsMessage(key: string): Promise<void> {
    await this.consume(this.wsMessageLimiter, key);
  }

  private async consume(limiter: RateLimiterRedis, key: string): Promise<void> {
    try {
      await limiter.consume(key);
    } catch (rejectedOrError) {
      if (rejectedOrError instanceof RateLimiterRes) {
        throw new HttpException(
          {
            code: ErrorCode.RATE_LIMIT_EXCEEDED,
            message: 'Too many requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.warn(
        `Rate limiter backend error, failing open: ${rejectedOrError instanceof Error ? rejectedOrError.message : String(rejectedOrError)}`,
      );
    }
  }
}
