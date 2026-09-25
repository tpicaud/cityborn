import { createMock } from '@golevelup/ts-jest';
import { RateLimiterRes } from 'rate-limiter-flexible';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RateLimitService', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const redisService: RedisService = new RedisService(
    infrastructure.redis,
    createMock<WideEventService>(),
  );
  const rateLimitService: RateLimitService = new RateLimitService(redisService);
  afterAll(async () => {
    await infrastructure.close();
  });

  describe('reservePasswordResetEmail', () => {
    it('accepts exactly one concurrent reservation for three minutes', async () => {
      const results: boolean[] = await Promise.all(
        Array.from({ length: 10 }, () =>
          rateLimitService.reservePasswordResetEmail('email-hash'),
        ),
      );

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(
        await infrastructure.redis.ttl('rl:password-reset:email:email-hash'),
      ).toBeGreaterThan(175);
      expect(
        await rateLimitService.reservePasswordResetEmail(
          'different-email-hash',
        ),
      ).toBe(true);
      await infrastructure.redis.del('rl:password-reset:email:email-hash');
      expect(
        await rateLimitService.reservePasswordResetEmail('email-hash'),
      ).toBe(true);
    });
  });

  describe('consumePasswordReset', () => {
    it('allows five requests per IP in fifteen minutes', async () => {
      for (let count: number = 0; count < 5; count++)
        await rateLimitService.consumePasswordReset('first-ip');

      await expect(
        rateLimitService.consumePasswordReset('first-ip'),
      ).rejects.toBeInstanceOf(RateLimiterRes);
      expect(
        await infrastructure.redis.ttl('rl:password-reset:ip:first-ip'),
      ).toBeGreaterThan(895);
      await expect(
        rateLimitService.consumePasswordReset('other-ip'),
      ).resolves.toBeInstanceOf(RateLimiterRes);
    });
  });
});
