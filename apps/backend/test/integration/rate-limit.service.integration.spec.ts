import { buildUser, type UserId } from '@cityborn/api';
import { RateLimiterRes } from 'rate-limiter-flexible';
import { RateLimitService } from '../../src/rate-limit/rate-limit.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RateLimitService with Redis', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { redis }: typeof infrastructure = infrastructure;
  const rateLimitService: RateLimitService = new RateLimitService(redis);

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

  describe('reservePasswordResetEmail', () => {
    it('accepts exactly one concurrent reservation for three minutes', async () => {
      const results: boolean[] = await Promise.all(
        Array.from({ length: 10 }, () =>
          rateLimitService.reservePasswordResetEmail('email-hash'),
        ),
      );

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(
        await redis.ttl('rl:password-reset:email:email-hash'),
      ).toBeGreaterThan(175);
      expect(
        await rateLimitService.reservePasswordResetEmail(
          'different-email-hash',
        ),
      ).toBe(true);
      await redis.del('rl:password-reset:email:email-hash');
      expect(
        await rateLimitService.reservePasswordResetEmail('email-hash'),
      ).toBe(true);
    });
  });

  describe('consumePasswordReset', () => {
    it('allows five requests per IP in fifteen minutes', async () => {
      await Promise.all(
        Array.from({ length: 5 }, () =>
          rateLimitService.consumePasswordReset('first-ip'),
        ),
      );

      await expect(
        rateLimitService.consumePasswordReset('first-ip'),
      ).rejects.toBeInstanceOf(RateLimiterRes);
      expect(await redis.ttl('rl:password-reset:ip:first-ip')).toBeGreaterThan(
        895,
      );
      await expect(
        rateLimitService.consumePasswordReset('other-ip'),
      ).resolves.toBeInstanceOf(RateLimiterRes);
    });
  });
});
