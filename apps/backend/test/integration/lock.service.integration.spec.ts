import { createMock } from '@golevelup/ts-jest';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { LockService } from '../../src/lock/lock.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('LockService with Redis', () => {
  const infrastructure = createTestInfrastructure();
  const { redis } = infrastructure;
  const lockService = new LockService(redis, createMock<WideEventService>());

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('LockService.withLock', () => {
    it('rejects concurrent acquisition of the same resource', async () => {
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
        },
      );
      await entered;

      try {
        await expect(
          lockService.withLock('integration:contended', 5_000, async () => {}),
        ).rejects.toThrow();
      } finally {
        releaseFirst();
      }
      await first;
    });

    it('releases a lock after success and permits reacquisition', async () => {
      const first = await lockService.withLock(
        'integration:completed',
        5_000,
        async () => 'first',
      );

      const second = await lockService.withLock(
        'integration:completed',
        5_000,
        async () => 'second',
      );

      expect(first).toBe('first');
      expect(second).toBe('second');
      expect(await redis.exists('lock:integration:completed')).toBe(0);
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
});
