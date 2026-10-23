import type { Theme } from '@cityborn/api';
import { buildTheme } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaThemeRepository } from '../../src/theme/repositories/prisma-theme.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaThemeRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let themeRepository: PrismaThemeRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaThemeRepository],
    }).compile();
    await module.init();
    themeRepository = module.get(PrismaThemeRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('findAll', () => {
    it('lists every theme by name', async () => {
      const sportTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000050',
        name: 'Sport',
      });
      const musicTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000051',
        name: 'Musique',
      });
      await prisma.theme.create({ data: sportTheme });
      await prisma.theme.create({ data: musicTheme });

      const themes: Theme[] = await themeRepository.findAll();

      expect(themes).toEqual([musicTheme, sportTheme]);
    });
  });

  describe('findById', () => {
    it('returns the requested theme', async () => {
      const theme: Theme = buildTheme();
      await prisma.theme.create({ data: theme });

      const foundTheme: Theme | null = await themeRepository.findById(theme.id);

      expect(foundTheme).toEqual(theme);
    });

    it('returns null for an unknown theme', async () => {
      const theme: Theme = buildTheme();

      const foundTheme: Theme | null = await themeRepository.findById(theme.id);

      expect(foundTheme).toBeNull();
    });
  });
});
