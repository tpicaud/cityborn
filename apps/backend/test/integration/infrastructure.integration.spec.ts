import type { User } from '@cityborn/api';
import { buildUser } from '@cityborn/api';
import type { Prisma } from '@prisma/client';
import { createTestInfrastructure } from '../support/infrastructure';
import { resetDb } from '../support/resetDb';

describe('Test infrastructure', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma, redis }: typeof infrastructure = infrastructure;

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('resetDb', () => {
    it('clears related records and preserves migrations and PostGIS metadata', async () => {
      const migrationsBefore: { migration_name: string }[] =
        await prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name
      `;
      const spatialReferencesBefore: { count: bigint }[] =
        await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) FROM spatial_ref_sys
      `;
      const userData: User = buildUser();
      const user: Prisma.UserGetPayload<{
        include: { tokens: true; gameRecords: true };
      }> = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          type: userData.type,
          isVerified: userData.isVerified,
          tokens: {
            create: {
              token: 'infrastructure-token',
              expiresAt: new Date('2099-01-01'),
            },
          },
          gameRecords: {
            create: {
              mode: 'solo',
              gameConfig: {},
              players: [],
              guessObjectsIds: [],
              results: {},
            },
          },
        },
        include: { tokens: true, gameRecords: true },
      });

      expect(user.tokens).toHaveLength(1);
      expect(user.gameRecords).toHaveLength(1);

      await resetDb(prisma);

      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.emailVerificationToken.count()).toBe(0);
      expect(await prisma.gameRecord.count()).toBe(0);
      expect(await prisma.$queryRaw`SELECT * FROM "_GameRecordUsers"`).toEqual(
        [],
      );
      expect(
        await prisma.$queryRaw`
          SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name
        `,
      ).toEqual(migrationsBefore);
      expect(
        await prisma.$queryRaw`SELECT count(*) FROM spatial_ref_sys`,
      ).toEqual(spatialReferencesBefore);
    });

    it('refuses to truncate a connection to another database', async () => {
      const query: jest.SpiedFunction<typeof prisma.$queryRaw> = jest
        .spyOn(prisma, '$queryRaw')
        .mockResolvedValueOnce([{ database: 'postgres', user: 'postgres' }]);
      const execute: jest.SpiedFunction<typeof prisma.$executeRawUnsafe> =
        jest.spyOn(prisma, '$executeRawUnsafe');

      try {
        await expect(resetDb(prisma)).rejects.toThrow(
          'resetDb only supports the dedicated cityborn_test database',
        );
        expect(query).toHaveBeenCalledTimes(1);
        expect(execute).not.toHaveBeenCalled();
      } finally {
        query.mockRestore();
        execute.mockRestore();
      }
    });
  });

  describe('reset', () => {
    it('connects to Redis and clears test keys', async () => {
      await redis.set('infrastructure:probe', 'test');
      expect(await redis.get('infrastructure:probe')).toBe('test');

      await infrastructure.reset();

      expect(await redis.get('infrastructure:probe')).toBeNull();
    });
  });
});
