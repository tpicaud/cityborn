import type { AdminTheme, Theme } from '@cityborn/api';
import { buildTheme } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Pack as PrismaPack } from '@prisma/client';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaThemeRepository } from '../../src/theme/repositories/prisma-theme.repository';
import {
  ThemeHasPacksError,
  ThemeNameAlreadyExistsError,
} from '../../src/theme/repositories/theme.repository';
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

      const themes: AdminTheme[] = await themeRepository.findAll();

      expect(themes).toEqual([
        { ...musicTheme, packCount: 0, isDefault: false },
        { ...sportTheme, packCount: 0, isDefault: false },
      ]);
    });

    it('counts published and hidden packs including sub-packs', async () => {
      const theme: Theme = buildTheme();
      await prisma.theme.create({ data: theme });
      const parent: PrismaPack = await prisma.pack.create({
        data: { name: 'Parent', themeId: theme.id, isPublished: true },
      });
      await prisma.pack.create({
        data: {
          name: 'Child',
          parentId: parent.id,
          themeId: theme.id,
          isPublished: false,
        },
      });
      await prisma.pack.create({
        data: { name: 'Hidden', themeId: theme.id, isPublished: false },
      });

      const themes: AdminTheme[] = await themeRepository.findAll();

      expect(themes).toEqual([{ ...theme, packCount: 3, isDefault: true }]);
    });
  });
  describe('create', () => {
    it('rejects a name differing only by case', async () => {
      await themeRepository.create({ name: 'Sport' });

      await expect(
        themeRepository.create({ name: 'sport' }),
      ).rejects.toBeInstanceOf(ThemeNameAlreadyExistsError);
    });
  });
  describe('update', () => {
    it('rejects renaming to an existing name with different case', async () => {
      await themeRepository.create({ name: 'Sport' });
      const theme: Theme = await themeRepository.create({ name: 'Musique' });

      await expect(
        themeRepository.update({ id: theme.id, theme: { name: 'SPORT' } }),
      ).rejects.toBeInstanceOf(ThemeNameAlreadyExistsError);
      await expect(themeRepository.findById(theme.id)).resolves.toEqual(theme);
    });
    it('allows changing only the case of its own name', async () => {
      const theme: Theme = await themeRepository.create({ name: 'Sport' });

      await expect(
        themeRepository.update({ id: theme.id, theme: { name: 'SPORT' } }),
      ).resolves.toEqual({ ...theme, name: 'SPORT' });
    });
  });
  describe('delete', () => {
    it('preserves an attached theme', async () => {
      const theme: Theme = await themeRepository.create({ name: 'Sport' });
      await prisma.pack.create({ data: { name: 'Parent', themeId: theme.id } });

      await expect(themeRepository.delete(theme.id)).rejects.toBeInstanceOf(
        ThemeHasPacksError,
      );
      await expect(themeRepository.findById(theme.id)).resolves.toEqual(theme);
    });
    it('removes an unused theme', async () => {
      const theme: Theme = await themeRepository.create({ name: 'Sport' });

      await themeRepository.delete(theme.id);

      await expect(themeRepository.findById(theme.id)).resolves.toBeNull();
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
