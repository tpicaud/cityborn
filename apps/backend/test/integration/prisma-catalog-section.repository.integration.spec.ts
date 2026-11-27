import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CatalogSection } from '@cityborn/api';
import { buildCatalogSection } from '@cityborn/api';
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
          '../../prisma/migrations/20261127074602_add_default_catalog_section/migration.sql',
        ),
        'utf8',
      );
      await insertCatalogSection({
        section: buildCatalogSection(),
        position: 0,
      });

      await prisma.$executeRawUnsafe(migration);

      await expect(catalogSectionRepository.findAll()).resolves.toEqual([
        defaultSection,
        buildCatalogSection(),
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
  });
});
