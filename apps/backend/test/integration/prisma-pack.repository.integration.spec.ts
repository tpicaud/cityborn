import type {
  CreatePack,
  FullPack,
  GuessObject,
  Pack,
  PackTree,
  UpdatePack,
  WorldLocation,
} from '@cityborn/api';
import {
  buildCreatePack,
  buildGuessObject,
  buildUpdatePack,
  buildWorldLocation,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaPackRepository } from '../../src/pack/repositories/prisma-pack.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaPackRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let packRepository: PrismaPackRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaPackRepository],
    }).compile();
    await module.init();
    packRepository = module.get(PrismaPackRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('findBy', () => {
    it('combines identifier and publication filters', async () => {
      const publishedData: CreatePack = buildCreatePack({
        name: 'Published',
        isPublished: true,
      });
      const hiddenData: CreatePack = buildCreatePack({
        name: 'Hidden',
        isPublished: false,
      });
      const unrelatedData: CreatePack = buildCreatePack({
        name: 'Unrelated',
        isPublished: true,
      });
      const published: Pack = await packRepository.create(publishedData);
      const hidden: Pack = await packRepository.create(hiddenData);
      await packRepository.create(unrelatedData);

      const packs: Pack[] = await packRepository.findBy({
        ids: [published.id, hidden.id],
        isPublished: true,
      });

      expect(packs.map(({ id }) => id)).toEqual([published.id]);
    });
  });

  describe('findFullBy', () => {
    it('loads linked guess objects and applies the publication filter', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const publishedData: CreatePack = buildCreatePack({
        name: 'Published',
        isPublished: true,
        guessObjectsIds: [guessObject.id],
      });
      const hiddenData: CreatePack = buildCreatePack({
        name: 'Hidden',
        isPublished: false,
        guessObjectsIds: [guessObject.id],
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });
      const published: Pack = await packRepository.create(publishedData);
      await packRepository.create(hiddenData);

      const packs: FullPack[] = await packRepository.findFullBy({
        isPublished: true,
      });

      expect(packs).toMatchObject([
        {
          id: published.id,
          guessObjects: [
            {
              id: guessObject.id,
              world_location_preview: { id: location.id },
            },
          ],
        },
      ]);
    });
  });

  describe('create', () => {
    it('connects a guess object when creating a pack', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const packData: CreatePack = buildCreatePack({
        guessObjectsIds: [guessObject.id],
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });

      const pack: Pack = await packRepository.create(packData);
      const packs: FullPack[] = await packRepository.findFullBy({
        ids: [pack.id],
      });

      expect(packs[0]?.guessObjects.map(({ id }) => id)).toEqual([
        guessObject.id,
      ]);
      expect(await packRepository.countByGuessObjectId(guessObject.id)).toBe(1);
    });
  });

  describe('update', () => {
    it('connects a guess object when updating a pack', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const packData: CreatePack = buildCreatePack();
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });
      const pack: Pack = await packRepository.create(packData);
      const updateData: UpdatePack = buildUpdatePack({
        id: pack.id,
        name: 'Connected',
        connectIds: [guessObject.id],
      });

      const updated: Pack = await packRepository.update(pack.id, updateData);

      expect(updated.name).toBe('Connected');
      expect(
        (
          await packRepository.findFullBy({ ids: [pack.id] })
        )[0]?.guessObjects.map(({ id }) => id),
      ).toEqual([guessObject.id]);
    });

    it('disconnects a guess object when updating a pack', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const packData: CreatePack = buildCreatePack({
        guessObjectsIds: [guessObject.id],
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });
      const pack: Pack = await packRepository.create(packData);
      const updateData: UpdatePack = buildUpdatePack({
        id: pack.id,
        disconnectIds: [guessObject.id],
      });

      await packRepository.update(pack.id, updateData);

      expect(await packRepository.countByGuessObjectId(guessObject.id)).toBe(0);
      expect(
        (await packRepository.findFullBy({ ids: [pack.id] }))[0]?.guessObjects,
      ).toEqual([]);
    });
  });

  describe('countChildren', () => {
    it('counts direct children without counting grandchildren', async () => {
      const parentData: CreatePack = buildCreatePack({
        name: 'Parent',
      });
      const parent: Pack = await packRepository.create(parentData);
      const childData: CreatePack = buildCreatePack({
        name: 'Child',
        parentId: parent.id,
      });
      const child: Pack = await packRepository.create(childData);
      const grandchildData: CreatePack = buildCreatePack({
        name: 'Grandchild',
        parentId: child.id,
      });
      await packRepository.create(grandchildData);

      const count: number = await packRepository.countChildren(parent.id);

      expect(count).toBe(1);
    });
  });

  describe('countByGuessObjectId', () => {
    it('counts only packs linked to the requested guess object', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const otherGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Louvre Museum',
      });
      const packData: CreatePack = buildCreatePack({
        guessObjectsIds: [guessObject.id],
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: [
              { id: guessObject.id, name: guessObject.name },
              { id: otherGuessObject.id, name: otherGuessObject.name },
            ],
          },
        },
      });
      await packRepository.create(packData);

      const linkedCount: number = await packRepository.countByGuessObjectId(
        guessObject.id,
      );
      const unlinkedCount: number = await packRepository.countByGuessObjectId(
        otherGuessObject.id,
      );

      expect(linkedCount).toBe(1);
      expect(unlinkedCount).toBe(0);
    });
  });

  describe('delete', () => {
    it('removes the requested pack', async () => {
      const packData: CreatePack = buildCreatePack();
      const pack: Pack = await packRepository.create(packData);

      await packRepository.delete(pack.id);

      expect(await packRepository.findBy({ ids: [pack.id] })).toEqual([]);
    });
  });

  describe('findTree', () => {
    it('loads nested packs beneath published roots', async () => {
      const rootData: CreatePack = buildCreatePack({
        name: 'Countries',
        isPublished: true,
      });
      const root: Pack = await packRepository.create(rootData);
      const childData: CreatePack = buildCreatePack({
        name: 'France',
        parentId: root.id,
      });
      const child: Pack = await packRepository.create(childData);
      const hiddenData: CreatePack = buildCreatePack({
        name: 'Hidden',
        isPublished: false,
      });
      await packRepository.create(hiddenData);

      const tree: PackTree[] = await packRepository.findTree({
        isPublished: true,
      });

      expect(tree).toMatchObject([
        { id: root.id, name: 'Countries', children: [{ id: child.id }] },
      ]);
    });
  });
});
