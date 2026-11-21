import { RedisConsumedRefreshTokenRepository } from '../../src/auth/repositories/redis-consumed-refresh-token.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RedisConsumedRefreshTokenRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const consumedRefreshTokenRepository: RedisConsumedRefreshTokenRepository =
    new RedisConsumedRefreshTokenRepository(infrastructure.redis);

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('consume', () => {
    it('consumes a refresh token only once', async () => {
      const expiresAt: Date = new Date(Date.now() + 600_000);

      const firstConsumption: boolean =
        await consumedRefreshTokenRepository.consume({
          refreshTokenHash: 'once-hash',
          expiresAt,
        });
      const secondConsumption: boolean =
        await consumedRefreshTokenRepository.consume({
          refreshTokenHash: 'once-hash',
          expiresAt,
        });

      expect(firstConsumption).toBe(true);
      expect(secondConsumption).toBe(false);
    });

    it('accepts a single consumption among concurrent attempts', async () => {
      const expiresAt: Date = new Date(Date.now() + 600_000);

      const consumptions: boolean[] = await Promise.all(
        Array.from({ length: 10 }, () =>
          consumedRefreshTokenRepository.consume({
            refreshTokenHash: 'concurrent-hash',
            expiresAt,
          }),
        ),
      );

      expect(consumptions.filter((consumed: boolean) => consumed)).toHaveLength(
        1,
      );
    });

    it('forgets a consumed refresh token once it expires', async () => {
      const expiresAt: Date = new Date(Date.now() + 1_000);
      await consumedRefreshTokenRepository.consume({
        refreshTokenHash: 'expiring-hash',
        expiresAt,
      });

      await new Promise((resolve) => setTimeout(resolve, 1_100));
      const consumedAfterExpiration: boolean =
        await consumedRefreshTokenRepository.consume({
          refreshTokenHash: 'expiring-hash',
          expiresAt: new Date(Date.now() + 600_000),
        });

      expect(consumedAfterExpiration).toBe(true);
    });
  });
});
