import { createMock } from '@golevelup/ts-jest';
import type { WideEventService } from '../../src/common/wide-event/wide-event.service';
import { LockService } from '../../src/lock/lock.service';
import { createTestInfrastructure } from '../support/infrastructure';

describe('LockService with Redis', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { redis }: typeof infrastructure = infrastructure;
  const lockService: LockService = new LockService(
    redis,
    createMock<WideEventService>(),
  );

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('withLock', () => {
    it('rejects concurrent acquisition of the same resource', async () => {
      let markEntered: () => void = () => {};
      let releaseFirst: () => void = () => {};
      const entered: Promise<void> = new Promise<void>((resolve) => {
        markEntered = resolve;
      });
      const release: Promise<void> = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      const first: Promise<void> = lockService.withLock(
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
      const first: string = await lockService.withLock(
        'integration:completed',
        5_000,
        async () => 'first',
      );

      const second: string = await lockService.withLock(
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
