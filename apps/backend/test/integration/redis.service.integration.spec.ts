import { createMock } from '@golevelup/ts-jest';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RedisService with Redis', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { redis }: typeof infrastructure = infrastructure;
  const redisService: RedisService = new RedisService(
    redis,
    createMock<WideEventService>(),
  );

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('setJSON', () => {
    it('serializes JSON and applies a TTL', async () => {
      const payload: { player: string; score: number } = {
        player: 'host',
        score: 12,
      };

      await redisService.setJSON('integration:payload', payload, 10);

      expect(
        await redisService.getJSON<typeof payload>('integration:payload'),
      ).toEqual({ player: 'host', score: 12 });
      expect(await redis.ttl('integration:payload')).toBeGreaterThan(0);
      expect(await redis.ttl('integration:payload')).toBeLessThanOrEqual(10);
    });
  });

  describe('set', () => {
    it('expires a key after its TTL', async () => {
      await redisService.set('integration:ttl', 'value', 1);

      await new Promise((resolve) => setTimeout(resolve, 1_100));

      expect(await redisService.get('integration:ttl')).toBeNull();
    });
  });

  describe('expire', () => {
    it('expires a key immediately when requested', async () => {
      await redisService.setJSON('integration:expiring', { value: true });

      await redisService.expire('integration:expiring', 0);

      expect(await redisService.getJSON('integration:expiring')).toBeNull();
    });
  });

  describe('del', () => {
    it('deletes a stored value', async () => {
      await redisService.set('integration:deleting', 'value');

      const deleted: number = await redisService.del('integration:deleting');

      expect(deleted).toBe(1);
      expect(await redisService.get('integration:deleting')).toBeNull();
    });
  });
});
