import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CatalogSection, Pack } from '@cityborn/api';
import { buildCatalogSection, buildPack, buildTheme } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { defaultCatalogSectionId } from '../../src/catalog-section/default-catalog-section';
import { CatalogSectionNameAlreadyExistsError } from '../../src/catalog-section/repositories/catalog-section.repository';
import { PrismaCatalogSectionRepository } from '../../src/catalog-section/repositories/prisma-catalog-section.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

const defaultSection: CatalogSection = buildCatalogSection({
  id: defaultCatalogSectionId,
  name: 'Tous les packs',
  isDefault: true,
});

describe('PrismaCatalogSectionRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let catalogSectionRepository: PrismaCatalogSectionRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaCatalogSectionRepository],
    }).compile();
    await module.init();
    catalogSectionRepository = module.get(PrismaCatalogSectionRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  async function insertCatalogSection({
    section,
    position,
  }: {
    section: CatalogSection;
    position: number;
  }): Promise<void> {
    await prisma.catalogSection.create({
      data: { id: section.id, name: section.name, position },
    });
  }

  async function insertPack(pack: Pack): Promise<void> {
    await prisma.pack.create({
      data: {
        id: pack.id,
        name: pack.name,
        isPublished: pack.isPublished,
        image: pack.image,
        themeId: pack.themeId,
      },
    });
  }

  async function insertSectionWithPacks({
    section,
    packs,
  }: {
    section: CatalogSection;
    packs: Pack[];
  }): Promise<void> {
    await insertCatalogSection({ section, position: 0 });
    await Promise.all(packs.map((pack) => insertPack(pack)));
    await addPacks({ section, packs });
  }

  async function addPacks({
    section,
    packs: [pack, ...remainingPacks],
  }: {
    section: CatalogSection;
    packs: Pack[];
  }): Promise<void> {
    if (!pack) return;
    await catalogSectionRepository.addPack({ id: section.id, packId: pack.id });
    await addPacks({ section, packs: remainingPacks });
  }

  const monuments: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000070',
    name: 'Monuments',
  });
  const capitals: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000071',
    name: 'Capitales',
  });
  const rivers: Pack = buildPack({
    id: '00000000-0000-4000-8000-000000000072',
    name: 'Fleuves',
  });

  beforeEach(async () => {
    await prisma.theme.create({ data: buildTheme() });
  });

  describe('findAll', () => {
    it('lists every section by position, then by name', async () => {
      const news: CatalogSection = buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000060',
        name: 'Nouveautés',
      });
      const events: CatalogSection = buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000061',
        name: 'Évènements',
      });
      const classics: CatalogSection = buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000062',
        name: 'Classiques',
      });
      await insertCatalogSection({ section: news, position: 0 });
      await insertCatalogSection({ section: events, position: 1 });
      await insertCatalogSection({ section: classics, position: 1 });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findAll();

      expect(sections).toEqual([news, classics, events]);
    });

    it('lists the default section inserted by its migration', async () => {
      const migration: string = readFileSync(
        resolve(
          __dirname,
          '../../prisma/migrations/20261121155308_add_catalog_section/migration.sql',
        ),
        'utf8',
      );
      const insertion: string = migration.slice(
        migration.indexOf('INSERT INTO "CatalogSection"'),
      );

      await prisma.$executeRawUnsafe(insertion);

      await expect(catalogSectionRepository.findAll()).resolves.toEqual([
        defaultSection,
      ]);
    });

    it('drops a deleted pack from its sections', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({
        section: events,
        packs: [monuments, capitals],
      });

      await prisma.pack.delete({ where: { id: monuments.id } });

      await expect(catalogSectionRepository.findAll()).resolves.toEqual([
        { ...events, packIds: [capitals.id] },
      ]);
    });
  });

  describe('findPlayable', () => {
    it('lists only the default section while the others have no pack', async () => {
      await insertCatalogSection({
        section: buildCatalogSection(),
        position: 0,
      });
      await insertCatalogSection({ section: defaultSection, position: 1 });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findPlayable();

      expect(sections).toEqual([defaultSection]);
    });

    it('lists a section with its published packs in order of addition', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      const hiddenPack: Pack = buildPack({
        id: '00000000-0000-4000-8000-000000000073',
        isPublished: false,
      });
      await insertSectionWithPacks({
        section: events,
        packs: [rivers, hiddenPack, monuments, capitals],
      });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findPlayable();

      expect(sections).toEqual([
        { ...events, packIds: [rivers.id, monuments.id, capitals.id] },
      ]);
    });

    it('hides a section whose packs are all unpublished', async () => {
      await insertSectionWithPacks({
        section: buildCatalogSection(),
        packs: [buildPack({ isPublished: false })],
      });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findPlayable();

      expect(sections).toEqual([]);
    });

    it('gives a republished pack its place back', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({
        section: events,
        packs: [monuments, capitals, rivers],
      });
      await prisma.pack.update({
        where: { id: capitals.id },
        data: { isPublished: false },
      });
      await prisma.pack.update({
        where: { id: capitals.id },
        data: { isPublished: true },
      });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findPlayable();

      expect(sections).toEqual([
        { ...events, packIds: [monuments.id, capitals.id, rivers.id] },
      ]);
    });
  });

  describe('create', () => {
    it('places a new section after the last one', async () => {
      await insertCatalogSection({
        section: buildCatalogSection(),
        position: 4,
      });

      const section: CatalogSection =
        await catalogSectionRepository.create('Évènements');

      expect(section.name).toBe('Évènements');
      await expect(
        prisma.catalogSection.findUnique({ where: { id: section.id } }),
      ).resolves.toMatchObject({ position: 5 });
    });

    it('rejects a name differing only by case', async () => {
      await catalogSectionRepository.create('Évènements');

      await expect(
        catalogSectionRepository.create('évènements'),
      ).rejects.toBeInstanceOf(CatalogSectionNameAlreadyExistsError);
    });

    it('rejects the name of the default section differing only by case', async () => {
      await insertCatalogSection({ section: defaultSection, position: 0 });

      await expect(
        catalogSectionRepository.create('tous les packs'),
      ).rejects.toBeInstanceOf(CatalogSectionNameAlreadyExistsError);
    });

    it('accepts a name differing by its accents', async () => {
      await catalogSectionRepository.create('Évènements');

      const section: CatalogSection =
        await catalogSectionRepository.create('Événements');

      expect(section.name).toBe('Événements');
    });
  });

  describe('rename', () => {
    it('renames the section', async () => {
      const section: CatalogSection =
        await catalogSectionRepository.create('Événements');

      const renamedSection: CatalogSection | null =
        await catalogSectionRepository.rename({
          id: section.id,
          name: 'Évènements',
        });

      expect(renamedSection).toEqual({
        id: section.id,
        name: 'Évènements',
        isDefault: false,
        packIds: [],
      });
    });

    it('rejects renaming to an existing name with different case', async () => {
      await catalogSectionRepository.create('Nouveautés');
      const section: CatalogSection =
        await catalogSectionRepository.create('Évènements');

      await expect(
        catalogSectionRepository.rename({ id: section.id, name: 'NOUVEAUTÉS' }),
      ).rejects.toBeInstanceOf(CatalogSectionNameAlreadyExistsError);
      await expect(catalogSectionRepository.findAll()).resolves.toContainEqual(
        section,
      );
    });

    it('returns null for an unknown section', async () => {
      const renamedSection: CatalogSection | null =
        await catalogSectionRepository.rename({
          id: buildCatalogSection().id,
          name: 'Évènements',
        });

      expect(renamedSection).toBeNull();
    });
  });

  describe('reorder', () => {
    it('positions sections in the given order', async () => {
      const news: CatalogSection =
        await catalogSectionRepository.create('Nouveautés');
      const events: CatalogSection =
        await catalogSectionRepository.create('Évènements');

      await catalogSectionRepository.reorder([events.id, news.id]);

      await expect(catalogSectionRepository.findAll()).resolves.toEqual([
        events,
        news,
      ]);
    });
  });

  describe('delete', () => {
    it('removes the section', async () => {
      const section: CatalogSection =
        await catalogSectionRepository.create('Évènements');

      const isDeleted: boolean = await catalogSectionRepository.delete(
        section.id,
      );

      expect(isDeleted).toBe(true);
      await expect(catalogSectionRepository.findAll()).resolves.toEqual([]);
    });

    it('reports an unknown section', async () => {
      const isDeleted: boolean = await catalogSectionRepository.delete(
        buildCatalogSection().id,
      );

      expect(isDeleted).toBe(false);
    });

    it('keeps the packs of the deleted section', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({ section: events, packs: [monuments] });

      await catalogSectionRepository.delete(events.id);

      await expect(prisma.pack.count()).resolves.toBe(1);
    });
  });

  describe('addPack', () => {
    it('places a pack added again after its removal at the end', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({
        section: events,
        packs: [monuments, capitals],
      });
      await catalogSectionRepository.removePack({
        id: events.id,
        packId: monuments.id,
      });

      const section: CatalogSection | null =
        await catalogSectionRepository.addPack({
          id: events.id,
          packId: monuments.id,
        });

      expect(section?.packIds).toEqual([capitals.id, monuments.id]);
    });

    it('keeps a pack once in a section, at its place', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({
        section: events,
        packs: [monuments, capitals],
      });

      const section: CatalogSection | null =
        await catalogSectionRepository.addPack({
          id: events.id,
          packId: monuments.id,
        });

      expect(section?.packIds).toEqual([monuments.id, capitals.id]);
    });

    it('lets a pack belong to several sections', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      const news: CatalogSection = buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000063',
        name: 'Nouveautés',
      });
      await insertSectionWithPacks({ section: events, packs: [monuments] });
      await insertCatalogSection({ section: news, position: 1 });

      await catalogSectionRepository.addPack({
        id: news.id,
        packId: monuments.id,
      });

      await expect(catalogSectionRepository.findAll()).resolves.toEqual([
        { ...events, packIds: [monuments.id] },
        { ...news, packIds: [monuments.id] },
      ]);
    });

    it('returns null for an unknown section', async () => {
      await insertPack(monuments);

      const section: CatalogSection | null =
        await catalogSectionRepository.addPack({
          id: buildCatalogSection().id,
          packId: monuments.id,
        });

      expect(section).toBeNull();
    });
  });

  describe('removePack', () => {
    it('removes the pack from the section only', async () => {
      const events: CatalogSection = buildCatalogSection({
        name: 'Évènements',
      });
      await insertSectionWithPacks({
        section: events,
        packs: [monuments, capitals],
      });

      const section: CatalogSection | null =
        await catalogSectionRepository.removePack({
          id: events.id,
          packId: monuments.id,
        });

      expect(section?.packIds).toEqual([capitals.id]);
      await expect(prisma.pack.count()).resolves.toBe(2);
    });

    it('returns null for an unknown section', async () => {
      const section: CatalogSection | null =
        await catalogSectionRepository.removePack({
          id: buildCatalogSection().id,
          packId: monuments.id,
        });

      expect(section).toBeNull();
    });
  });
});
