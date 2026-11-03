import { buildUser, type UserId } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { RateLimiterRes } from 'rate-limiter-flexible';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RateLimitService with Redis', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { redis }: typeof infrastructure = infrastructure;
  const rateLimitService: RateLimitService = new RateLimitService(
    new RedisService(redis, createMock<WideEventService>()),
  );

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('consumeEmailChange', () => {
    it('rejects a sixth email change for the same account', async () => {
      const userId: UserId = buildUser().id;
      await Promise.all(
        Array.from({ length: 5 }, () =>
          rateLimitService.consumeEmailChange(userId),
        ),
      );

      await expect(
        rateLimitService.consumeEmailChange(userId),
      ).rejects.toBeInstanceOf(RateLimiterRes);
    });
  });
});
