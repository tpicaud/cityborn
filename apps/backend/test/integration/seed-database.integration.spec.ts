import type { FullGuessObject, FullPack, PackId } from '@cityborn/api';
import { createGuess, guessObjectCenter } from '@cityborn/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { seedDatabase } from '../../prisma/seed/seed-database';
import { verifyPassword } from '../../src/auth/password-hashing';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaPackRepository } from '../../src/pack/repositories/prisma-pack.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

type SeededAccount = {
  username: string;
  role: string;
  isVerified: boolean;
  password: string | null;
};

type SeededPackSummary = {
  name: string;
  isPublished: boolean;
  personalities: string[];
};

describe('seedDatabase', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let packRepository: PrismaPackRepository;
  let guessObjectRepository: PrismaGuessObjectRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaPackRepository, PrismaGuessObjectRepository],
    }).compile();
    await module.init();
    packRepository = module.get(PrismaPackRepository);
    guessObjectRepository = module.get(PrismaGuessObjectRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  it('creates verified admin and player accounts with the seed password', async () => {
    await seedDatabase(prisma);

    const accounts: SeededAccount[] = await prisma.user.findMany({
      select: { username: true, role: true, isVerified: true, password: true },
      orderBy: { username: 'asc' },
    });
    const passwordMatches: boolean[] = await Promise.all(
      accounts.map((account: SeededAccount) =>
        verifyPassword({
          password: 'password123',
          passwordHash: account.password ?? '',
        }),
      ),
    );
    expect(
      accounts.map(({ username, role, isVerified }: SeededAccount) => ({
        username,
        role,
        isVerified,
      })),
    ).toEqual([
      { username: 'admin', role: 'admin', isVerified: true },
      { username: 'player', role: 'player', isVerified: true },
    ]);
    expect(passwordMatches).toEqual([true, true]);
  });

  it('publishes two packs of two personalities within one theme', async () => {
    await seedDatabase(prisma);

    const packs: FullPack[] = await packRepository.findFullBy({
      isPublished: true,
    });
    expect(new Set(packs.map((pack: FullPack) => pack.themeId)).size).toBe(1);
    expect(
      packs
        .map(
          (pack: FullPack): SeededPackSummary => ({
            name: pack.name,
            isPublished: pack.isPublished,
            personalities: pack.guessObjects.map(({ name }) => name).sort(),
          }),
        )
        .sort((left: SeededPackSummary, right: SeededPackSummary) =>
          left.name.localeCompare(right.name),
        ),
    ).toEqual([
      {
        name: 'Cinéma',
        isPublished: true,
        personalities: ['Leonardo DiCaprio', 'Marion Cotillard'],
      },
      {
        name: 'Pop',
        isPublished: true,
        personalities: ['Adele', 'Lady Gaga'],
      },
    ]);
  });

  it('lets a guess at the birthplace center win for every personality', async () => {
    await seedDatabase(prisma);
    const packs: FullPack[] = await packRepository.findFullBy({
      isPublished: true,
    });
    const packIds: PackId[] = packs.map((pack: FullPack) => pack.id);

    const guessObjects: FullGuessObject[] =
      await guessObjectRepository.findFullBy({ packIds });

    expect(guessObjects).toHaveLength(4);
    expect(
      guessObjects.map(
        (guessObject: FullGuessObject) =>
          createGuess(guessObject, guessObjectCenter(guessObject)).win,
      ),
    ).toEqual([true, true, true, true]);
  });

  it('keeps a single copy of each record when run twice', async () => {
    await seedDatabase(prisma);

    await seedDatabase(prisma);

    const [
      userCount,
      themeCount,
      packCount,
      guessObjectCount,
      worldLocationCount,
      geometryCount,
    ]: number[] = await Promise.all([
      prisma.user.count(),
      prisma.theme.count(),
      prisma.pack.count(),
      prisma.guessObject.count(),
      prisma.worldLocation.count(),
      prisma.worldLocationGeometry.count(),
    ]);
    expect({
      userCount,
      themeCount,
      packCount,
      guessObjectCount,
      worldLocationCount,
      geometryCount,
    }).toEqual({
      userCount: 2,
      themeCount: 1,
      packCount: 2,
      guessObjectCount: 4,
      worldLocationCount: 4,
      geometryCount: 4,
    });
  });
});
