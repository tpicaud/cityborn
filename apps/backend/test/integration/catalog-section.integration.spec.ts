import {
  buildPack,
  buildTheme,
  type CatalogSection,
  CatalogSectionMoveDirection,
  ErrorCode,
  GuessObjectIdSchema,
  type Pack,
  type Theme,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { CatalogSectionService } from '../../src/catalog-section/catalog-section.service';
import { CATALOG_SECTION_REPOSITORY } from '../../src/catalog-section/repositories/catalog-section.repository';
import { PrismaCatalogSectionRepository } from '../../src/catalog-section/repositories/prisma-catalog-section.repository';
import { GuessObjectService } from '../../src/guess-object/guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from '../../src/guess-object/repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { IconService } from '../../src/icon/icon.service';
import { ICON_PROVIDER } from '../../src/icon/providers/icon.provider';
import { IconifyIconProvider } from '../../src/icon/providers/iconify-icon.provider';
import { PackService } from '../../src/pack/pack.service';
import { PACK_REPOSITORY } from '../../src/pack/repositories/pack.repository';
import { PrismaPackRepository } from '../../src/pack/repositories/prisma-pack.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaThemeRepository } from '../../src/theme/repositories/prisma-theme.repository';
import { THEME_REPOSITORY } from '../../src/theme/repositories/theme.repository';
import { ThemeService } from '../../src/theme/theme.service';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { WORLD_LOCATION_REPOSITORY } from '../../src/world-location/repositories/world-location.repository';
import { WorldLocationService } from '../../src/world-location/world-location.service';
import { createTestInfrastructure } from '../support/infrastructure';

const up: CatalogSectionMoveDirection = CatalogSectionMoveDirection.UP;
const down: CatalogSectionMoveDirection = CatalogSectionMoveDirection.DOWN;
const sport: Theme = buildTheme({
  id: '00000000-0000-4000-8000-000000000051',
  name: 'Sport',
});
const music: Theme = buildTheme({
  id: '00000000-0000-4000-8000-000000000052',
  name: 'Musique',
});
const tennis: Pack = buildPack({ themeId: sport.id, name: 'Tennis' });
const football: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000011',
  themeId: sport.id,
  name: 'Foot',
  isPublished: false,
});
const rock: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000012',
  themeId: music.id,
  name: 'Rock',
});

describe('CatalogSectionService', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let service: CatalogSectionService;
  let packService: PackService;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [
        CatalogSectionService,
        {
          provide: CATALOG_SECTION_REPOSITORY,
          useClass: PrismaCatalogSectionRepository,
        },
        PackService,
        GuessObjectService,
        ThemeService,
        IconService,
        WorldLocationService,
        { provide: PACK_REPOSITORY, useClass: PrismaPackRepository },
        {
          provide: GUESS_OBJECT_REPOSITORY,
          useClass: PrismaGuessObjectRepository,
        },
        { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
        {
          provide: WORLD_LOCATION_REPOSITORY,
          useClass: PrismaWorldLocationRepository,
        },
        { provide: ICON_PROVIDER, useClass: IconifyIconProvider },
      ],
    }).compile();
    await module.init();
    service = module.get(CatalogSectionService);
    packService = module.get(PackService);
  });
  beforeEach(async () => {
    await prisma.theme.createMany({ data: [sport, music] });
    await prisma.pack.createMany({ data: [tennis, football, rock] });
  });
  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });
  describe('create', () => {
    it('serializes competing names in the same filter', async () => {
      const results: PromiseSettledResult<CatalogSection>[] =
        await Promise.allSettled([
          service.create({ name: '  Événements ', themeId: null }),
          service.create({ name: 'événements', themeId: null }),
        ]);

      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(await service.findAll(false)).toHaveLength(1);
    });
    it('allows the same name in different filters and keeps accents distinct', async () => {
      await service.create({ name: 'Événements', themeId: null });
      await service.create({ name: 'Événements', themeId: sport.id });
      await service.create({ name: 'Evenements', themeId: null });

      expect(await service.findAll(false)).toHaveLength(3);
    });
    it('rejects an unknown theme without saving a section', async () => {
      const theme: Theme = buildTheme();

      await expect(
        service.create({ name: 'Nouveautés', themeId: theme.id }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.THEME_NOT_FOUND },
      });
      expect(await service.findAll(false)).toEqual([]);
    });
  });
  describe('rename', () => {
    it('keeps the previous name when another section already uses the requested name', async () => {
      await service.create({ name: 'Événements', themeId: null });
      const section: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });

      await expect(
        service.rename({ id: section.id, name: ' ÉVÉNEMENTS ' }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS },
      });
      expect(
        (await service.findAll(false)).find(({ id }) => id === section.id)
          ?.name,
      ).toBe('Nouveautés');
    });
    it('trims a rename and allows changing its own case', async () => {
      const section: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });

      expect(
        await service.rename({ id: section.id, name: ' NOUVEAUTÉS ' }),
      ).toEqual({ ...section, name: 'NOUVEAUTÉS' });
    });
  });
  describe('move', () => {
    it('moves sections only within their filter and appends subsequent creations', async () => {
      const first: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      const sportSection: CatalogSection = await service.create({
        name: 'Tennis',
        themeId: sport.id,
      });
      const second: CatalogSection = await service.create({
        name: 'Événements',
        themeId: null,
      });
      await service.move({ id: second.id, direction: up });
      const last: CatalogSection = await service.create({
        name: 'Classiques',
        themeId: null,
      });
      await service.move({ id: second.id, direction: up });

      expect(
        (await service.findAll(false)).filter(
          ({ themeId }) => themeId === null,
        ),
      ).toEqual([second, first, last]);
      expect(
        (await service.findAll(false)).filter(
          ({ themeId }) => themeId === sport.id,
        ),
      ).toEqual([sportSection]);
    });
  });
  describe('addPack', () => {
    it('rejects a pack from another theme and accepts unpublished packs', async () => {
      const section: CatalogSection = await service.create({
        name: 'Tennis',
        themeId: sport.id,
      });

      await expect(
        service.addPack({ id: section.id, packId: rock.id }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.CATALOG_SECTION_PACK_THEME_MISMATCH },
      });
      expect(
        await service.addPack({ id: section.id, packId: football.id }),
      ).toEqual({ ...section, packIds: [football.id] });
    });
    it('adds a pack once per section and appends it after removal', async () => {
      const first: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      const second: CatalogSection = await service.create({
        name: 'Événements',
        themeId: null,
      });
      await service.addPack({ id: first.id, packId: tennis.id });
      await service.addPack({ id: first.id, packId: football.id });
      await service.addPack({ id: second.id, packId: tennis.id });
      await service.addPack({ id: first.id, packId: tennis.id });
      await service.removePack({ id: first.id, packId: tennis.id });

      expect(
        await service.addPack({ id: first.id, packId: tennis.id }),
      ).toEqual({ ...first, packIds: [football.id, tennis.id] });
      expect(
        (await service.findAll(false)).find(({ id }) => id === second.id),
      ).toEqual({ ...second, packIds: [tennis.id] });
    });
  });
  describe('movePack', () => {
    it('changes only the selected section membership order', async () => {
      const first: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      const second: CatalogSection = await service.create({
        name: 'Événements',
        themeId: null,
      });
      await service.addPack({ id: first.id, packId: tennis.id });
      await service.addPack({ id: first.id, packId: rock.id });
      await service.addPack({ id: second.id, packId: tennis.id });
      await service.addPack({ id: second.id, packId: rock.id });

      expect(
        await service.movePack({
          id: first.id,
          packId: tennis.id,
          direction: down,
        }),
      ).toEqual({ ...first, packIds: [rock.id, tennis.id] });
      expect(
        (await service.findAll(false)).find(({ id }) => id === second.id),
      ).toEqual({ ...second, packIds: [tennis.id, rock.id] });
    });
  });
  describe('findAll', () => {
    it('hides empty sections and restores unpublished memberships at their original places', async () => {
      const section: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      await service.create({ name: 'Vide', themeId: sport.id });
      await service.addPack({ id: section.id, packId: football.id });
      await service.addPack({ id: section.id, packId: tennis.id });
      await prisma.pack.update({
        where: { id: tennis.id },
        data: { isPublished: false },
      });

      expect(await service.findAll(true)).toEqual([]);
      await prisma.pack.updateMany({ data: { isPublished: true } });
      expect(await service.findAll(true)).toEqual([
        { ...section, packIds: [football.id, tennis.id] },
      ]);
    });
  });
  describe('delete', () => {
    it('deletes memberships while preserving the section packs', async () => {
      const section: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      await service.addPack({ id: section.id, packId: tennis.id });

      await service.delete(section.id);

      expect(await service.findAll(false)).toEqual([]);
      expect(await prisma.catalogSectionPack.count()).toBe(0);
      expect(await prisma.pack.count()).toBe(3);
    });
  });
  describe('pack lifecycle', () => {
    it('removes old theme memberships permanently while preserving all-filter positions', async () => {
      const all: CatalogSection = await service.create({
        name: 'Nouveautés',
        themeId: null,
      });
      const sports: CatalogSection = await service.create({
        name: 'Tennis',
        themeId: sport.id,
      });
      await service.addPack({ id: all.id, packId: rock.id });
      await service.addPack({ id: all.id, packId: tennis.id });
      await service.addPack({ id: sports.id, packId: tennis.id });

      await packService.update(tennis.id, { ...tennis, themeId: music.id });
      await packService.update(tennis.id, { ...tennis, themeId: sport.id });

      expect(
        (await service.findAll(false)).find(({ id }) => id === sports.id),
      ).toEqual(sports);
      expect(
        (await service.findAll(false)).find(({ id }) => id === all.id),
      ).toEqual({ ...all, packIds: [rock.id, tennis.id] });
    });
    it('rolls back membership cleanup when the pack update fails', async () => {
      const section: CatalogSection = await service.create({
        name: 'Tennis',
        themeId: sport.id,
      });
      await service.addPack({ id: section.id, packId: tennis.id });

      await expect(
        packService.update(tennis.id, {
          ...tennis,
          themeId: music.id,
          connectIds: [
            GuessObjectIdSchema.parse('00000000-0000-4000-8000-000000000099'),
          ],
        }),
      ).rejects.toThrow();

      expect(
        (await service.findAll(false)).find(({ id }) => id === section.id),
      ).toEqual({ ...section, packIds: [tennis.id] });
      expect(
        await prisma.pack.findUnique({ where: { id: tennis.id } }),
      ).toMatchObject({ themeId: sport.id });
    });
    it('cascades pack and unused theme deletion to their memberships and sections', async () => {
      const section: CatalogSection = await service.create({
        name: 'Tennis',
        themeId: sport.id,
      });
      await service.addPack({ id: section.id, packId: tennis.id });

      await prisma.pack.deleteMany({ where: { themeId: sport.id } });
      expect(await prisma.catalogSectionPack.count()).toBe(0);
      await prisma.theme.delete({ where: { id: sport.id } });
      expect(await service.findAll(false)).toEqual([]);
      expect(await prisma.pack.count()).toBe(1);
    });
  });
});
