import type { AdminTheme, Theme } from '@cityborn/api';
import { buildTheme, ThemeIcon } from '@cityborn/api';
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
    it('lists every theme by position, then by name', async () => {
      const sportTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000050',
        name: 'Sport',
      });
      const musicTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000051',
        name: 'Musique',
      });
      const cinemaTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000052',
        name: 'Cinéma',
      });
      await prisma.theme.create({ data: { ...sportTheme, position: 0 } });
      await prisma.theme.create({ data: { ...musicTheme, position: 1 } });
      await prisma.theme.create({ data: { ...cinemaTheme, position: 1 } });

      const themes: AdminTheme[] = await themeRepository.findAll();

      expect(themes).toEqual([
        { ...sportTheme, packCount: 0, isDefault: false },
        { ...cinemaTheme, packCount: 0, isDefault: false },
        { ...musicTheme, packCount: 0, isDefault: false },
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
  describe('findPlayable', () => {
    it('lists by position the themes holding a published pack, sub-packs included', async () => {
      const sportTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000050',
        name: 'Sport',
        icon: ThemeIcon.BASKETBALL,
      });
      const musicTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000051',
        name: 'Musique',
        icon: ThemeIcon.MUSIC,
      });
      const hiddenTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000052',
        name: 'Cinéma',
      });
      const emptyTheme: Theme = buildTheme({
        id: '00000000-0000-4000-8000-000000000053',
        name: 'Éducation',
      });
      await prisma.theme.create({ data: { ...sportTheme, position: 1 } });
      await prisma.theme.create({ data: { ...musicTheme, position: 0 } });
      await prisma.theme.create({ data: { ...hiddenTheme, position: 2 } });
      await prisma.theme.create({ data: { ...emptyTheme, position: 3 } });
      const hiddenParent: PrismaPack = await prisma.pack.create({
        data: { name: 'Parent', themeId: hiddenTheme.id, isPublished: false },
      });
      await prisma.pack.create({
        data: {
          name: 'Child',
          parentId: hiddenParent.id,
          themeId: musicTheme.id,
          isPublished: true,
        },
      });
      await prisma.pack.create({
        data: { name: 'NBA', themeId: sportTheme.id, isPublished: true },
      });

      const themes: Theme[] = await themeRepository.findPlayable();

      expect(themes).toEqual([musicTheme, sportTheme]);
    });
  });
  describe('create', () => {
    it('places a new theme after the last one with the default icon', async () => {
      await prisma.theme.create({
        data: { ...buildTheme({ name: 'Sport' }), position: 4 },
      });

      const theme: Theme = await themeRepository.create({ name: 'Cinéma' });

      expect(theme).toMatchObject({
        name: 'Cinéma',
        icon: ThemeIcon.EDUCATION,
      });
      await expect(
        prisma.theme.findUnique({ where: { id: theme.id } }),
      ).resolves.toMatchObject({ position: 5 });
    });
    it('rejects a name differing only by case', async () => {
      await themeRepository.create({ name: 'Sport' });

      await expect(
        themeRepository.create({ name: 'sport' }),
      ).rejects.toBeInstanceOf(ThemeNameAlreadyExistsError);
    });
  });
  describe('update', () => {
    it('changes the icon without changing the name', async () => {
      const theme: Theme = await themeRepository.create({ name: 'Sport' });

      await expect(
        themeRepository.update({
          id: theme.id,
          theme: { name: 'Sport', icon: ThemeIcon.BASKETBALL },
        }),
      ).resolves.toEqual({ ...theme, icon: ThemeIcon.BASKETBALL });
    });
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
  describe('reorder', () => {
    it('positions themes in the given order', async () => {
      const sport: Theme = await themeRepository.create({ name: 'Sport' });
      const music: Theme = await themeRepository.create({ name: 'Musique' });
      const cinema: Theme = await themeRepository.create({ name: 'Cinéma' });

      await themeRepository.reorder([cinema.id, sport.id, music.id]);

      const themes: AdminTheme[] = await themeRepository.findAll();
      expect(themes.map(({ id }) => id)).toEqual([
        cinema.id,
        sport.id,
        music.id,
      ]);
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
