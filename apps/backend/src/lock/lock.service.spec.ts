import type { Redis } from 'ioredis';
import { LockService } from './lock.service';

describe('LockService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('gives up after retryCount + 1 Redis attempts instead of hammering an unavailable Redis', async () => {
    jest.useFakeTimers();
    const evalMock = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const fakeRedisClient = {
      evalsha: jest.fn().mockRejectedValue(new Error('NOSCRIPT')),
      eval: evalMock,
    } as unknown as Redis;

    const lockService = new LockService(fakeRedisClient);
    const result = lockService.withLock('session:abc', 2000, async () => 'ok');
    result.catch(() => {});

    await jest.runAllTimersAsync();

    await expect(result).rejects.toThrow(/quorum/);

    expect(evalMock).toHaveBeenCalledTimes(5);
  });
});
