import { buildUser } from '../support/fixtures';
import { createTestInfrastructure } from '../support/infrastructure';
import { resetDb } from '../support/resetDb';

describe('Test infrastructure', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma, redis } = infrastructure;

  afterAll(async () => {
    await infrastructure.close();
  });

  it('clears related records and preserves migrations and PostGIS metadata', async () => {
    const migrationsBefore = await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name
    `;
    const spatialReferencesBefore = await prisma.$queryRaw`
      SELECT count(*) FROM spatial_ref_sys
    `;
    const { id, email, username, type, isVerified } = buildUser();
    const user = await prisma.user.create({
      data: {
        id,
        email,
        username,
        type,
        isVerified,
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
    const query = jest
      .spyOn(prisma, '$queryRaw')
      .mockResolvedValueOnce([{ database: 'postgres', user: 'postgres' }]);
    const execute = jest.spyOn(prisma, '$executeRawUnsafe');

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

  it('connects to Redis and clears test keys', async () => {
    await redis.set('infrastructure:probe', 'test');
    expect(await redis.get('infrastructure:probe')).toBe('test');

    await infrastructure.reset();

    expect(await redis.get('infrastructure:probe')).toBeNull();
  });
});
