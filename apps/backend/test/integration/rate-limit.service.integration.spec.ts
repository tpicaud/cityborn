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

  async function consumeFromIps({
    email,
    clientIps,
  }: {
    email: string;
    clientIps: string[];
  }): Promise<void> {
    await Promise.all(
      clientIps.map((clientIp: string) =>
        rateLimitService.consumeAccountEmail({ email, clientIp }),
      ),
    );
  }

  describe('consumeAccountEmail', () => {
    it('rejects a sixth email to the same address from the same client, whatever the case', async () => {
      await consumeFromIps({
        email: 'alice@cityborn.test',
        clientIps: Array.from({ length: 5 }, () => '203.0.113.7'),
      });

      await expect(
        rateLimitService.consumeAccountEmail({
          email: 'Alice@Cityborn.test',
          clientIp: '203.0.113.7',
        }),
      ).rejects.toBeInstanceOf(RateLimiterRes);
    });

    it('still accepts the address from another client once one client is limited', async () => {
      await consumeFromIps({
        email: 'alice@cityborn.test',
        clientIps: Array.from({ length: 5 }, () => '203.0.113.7'),
      });
      await expect(
        rateLimitService.consumeAccountEmail({
          email: 'alice@cityborn.test',
          clientIp: '203.0.113.7',
        }),
      ).rejects.toBeInstanceOf(RateLimiterRes);

      await expect(
        rateLimitService.consumeAccountEmail({
          email: 'alice@cityborn.test',
          clientIp: '198.51.100.4',
        }),
      ).resolves.toBeUndefined();
    });

    it('rejects a twenty-first email to the same address across clients', async () => {
      await consumeFromIps({
        email: 'alice@cityborn.test',
        clientIps: Array.from(
          { length: 20 },
          (_value: unknown, index: number) => `203.0.113.${index}`,
        ),
      });

      await expect(
        rateLimitService.consumeAccountEmail({
          email: 'alice@cityborn.test',
          clientIp: '198.51.100.4',
        }),
      ).rejects.toBeInstanceOf(RateLimiterRes);
    });
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
