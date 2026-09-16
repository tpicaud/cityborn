import { createMock } from '@golevelup/ts-jest';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { LockService } from '../../src/lock/lock.service';
import { RedisService } from '../../src/redis/redis.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RedisService with Redis', () => {
  const infrastructure = createTestInfrastructure();
  const { redis } = infrastructure;
  const wideEventService = createMock<WideEventService>();
  const redisService = new RedisService(redis, wideEventService);

  afterAll(async () => {
    await infrastructure.close();
  });

  it('serializes JSON and applies a TTL', async () => {
    const payload = { player: 'host', score: 12 };

    await redisService.setJSON('integration:payload', payload, 10);

    expect(
      await redisService.getJSON<typeof payload>('integration:payload'),
    ).toEqual({
      player: 'host',
      score: 12,
    });
    expect(await redis.ttl('integration:payload')).toBeGreaterThan(0);
    expect(await redis.ttl('integration:payload')).toBeLessThanOrEqual(10);
  });

  it('expires a key and returns null for missing JSON', async () => {
    await redisService.setJSON('integration:expiring', { value: true });

    await redisService.expire('integration:expiring', 0);

    expect(await redisService.getJSON('integration:expiring')).toBeNull();
  });

  it('deletes a stored value', async () => {
    await redisService.set('integration:deleting', 'value');

    const deleted = await redisService.del('integration:deleting');

    expect(deleted).toBe(1);
    expect(await redisService.get('integration:deleting')).toBeNull();
  });
});

describe('LockService with Redis', () => {
  const infrastructure = createTestInfrastructure();
  const { redis } = infrastructure;
  const lockService = new LockService(redis, createMock<WideEventService>());

  afterAll(async () => {
    await infrastructure.close();
  });

  it('rejects contention and permits acquisition after success', async () => {
    let markEntered = () => {};
    let releaseFirst = () => {};
    const entered = new Promise<void>((resolve) => {
      markEntered = resolve;
    });
    const release = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = lockService.withLock(
      'integration:contended',
      5_000,
      async () => {
        markEntered();
        await release;
        return 'first';
      },
    );
    await entered;

    const contended = lockService.withLock(
      'integration:contended',
      5_000,
      async () => 'second',
    );
    try {
      await expect(contended).rejects.toThrow();
    } finally {
      releaseFirst();
    }
    await expect(first).resolves.toBe('first');

    await expect(
      lockService.withLock('integration:contended', 5_000, async () => 'next'),
    ).resolves.toBe('next');
    expect(await redis.exists('lock:integration:contended')).toBe(0);
  });

  it('releases a lock after its callback throws', async () => {
    await expect(
      lockService.withLock('integration:failed', 5_000, async () => {
        throw new Error('callback failed');
      }),
    ).rejects.toThrow('callback failed');

    expect(await redis.exists('lock:integration:failed')).toBe(0);
    await expect(
      lockService.withLock('integration:failed', 5_000, async () => 'next'),
    ).resolves.toBe('next');
  });
});
