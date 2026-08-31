import { ErrorCode } from '@cityborn/api';
import { HttpStatus } from '@nestjs/common';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import type { RedisService } from '../redis/redis.service';
import { RateLimitService } from './rate-limit.service';

jest.mock('rate-limiter-flexible', () => {
  const actual = jest.requireActual('rate-limiter-flexible');
  return {
    ...actual,
    RateLimiterRedis: jest.fn().mockImplementation(() => ({
      consume: jest.fn(),
    })),
  };
});

describe('RateLimitService', () => {
  const redisService = { redisClient: {} } as unknown as RedisService;
  let rateLimiteService: RateLimitService;
  let httpLimiter: { consume: jest.Mock };
  let wsConnectionLimiter: { consume: jest.Mock };
  let wsMessageLimiter: { consume: jest.Mock };

  const buildService = () => {
    jest.mocked(RateLimiterRedis).mockClear();

    const rateLimiteService = new RateLimitService(redisService);
    const instances = jest
      .mocked(RateLimiterRedis)
      .mock.results.map((result) => result.value as { consume: jest.Mock });

    return {
      rateLimiteService,
      httpLimiter: instances[0],
      wsConnectionLimiter: instances[1],
      wsMessageLimiter: instances[2],
    };
  };

  beforeEach(() => {
    ({ rateLimiteService, httpLimiter, wsConnectionLimiter, wsMessageLimiter } =
      buildService());
  });

  describe('Right paths', () => {
    it('returns the rate limiter result when consumption succeeds', async () => {
      const rateLimiterRes = new RateLimiterRes();
      httpLimiter.consume.mockResolvedValue(rateLimiterRes);

      await expect(rateLimiteService.consumeHttp('key')).resolves.toBe(
        rateLimiterRes,
      );
    });
  });

  describe('Wrong paths', () => {
    it('throws HttpException 429 with RATE_LIMIT_EXCEEDED when the limit is exceeded', async () => {
      wsConnectionLimiter.consume.mockRejectedValue(new RateLimiterRes());

      await expect(
        rateLimiteService.consumeWsConnection('1.2.3.4'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        response: expect.objectContaining({
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
        }),
      });
    });

    it('fails open when the Redis backend errors', async () => {
      wsMessageLimiter.consume.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        rateLimiteService.consumeWsMessage('player-1'),
      ).resolves.toBeUndefined();
    });
  });
});
