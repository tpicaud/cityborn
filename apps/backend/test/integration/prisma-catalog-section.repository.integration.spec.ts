import type { CatalogSection } from '@cityborn/api';
import { buildCatalogSection } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { CatalogSectionNameAlreadyExistsError } from '../../src/catalog-section/repositories/catalog-section.repository';
import { PrismaCatalogSectionRepository } from '../../src/catalog-section/repositories/prisma-catalog-section.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

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
      await prisma.catalogSection.create({ data: { ...news, position: 0 } });
      await prisma.catalogSection.create({ data: { ...events, position: 1 } });
      await prisma.catalogSection.create({
        data: { ...classics, position: 1 },
      });

      const sections: CatalogSection[] =
        await catalogSectionRepository.findAll();

      expect(sections).toEqual([news, classics, events]);
    });
  });

  describe('create', () => {
    it('places a new section after the last one', async () => {
      await prisma.catalogSection.create({
        data: { ...buildCatalogSection(), position: 4 },
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

      expect(renamedSection).toEqual({ id: section.id, name: 'Évènements' });
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
