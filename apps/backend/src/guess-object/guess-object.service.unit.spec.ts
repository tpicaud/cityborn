import { buildCategory, buildGameConfig, ErrorCode } from '@cityborn/api';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import { createMock } from '../../test/support/createMock';
import type { PrismaService } from '../prisma/prisma.service';
import type { WorldLocationService } from '../world-location/world-location.service';
import { GuessObjectService } from './guess-object.service';

const prismaCategory = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Monuments',
  isPublished: true,
  description: null,
  parentId: null,
} satisfies PrismaCategory;

const prismaWorldLocation = {
  id: 'location-1',
  osm_type: 'relation',
  external_id: '7444',
  name: 'Paris',
  display_name: 'Paris, France',
  addresstype: 'city',
  centroid: [48.8566, 2.3522],
  source: { provider: 'nominatim', external_id: '7444' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} satisfies PrismaWorldLocation;

const prismaWorldLocationGeometry = {
  id: 'geometry-1',
  data: { type: 'Point', coordinates: [2.3522, 48.8566] },
  world_location_id: 'location-1',
} satisfies PrismaWorldLocationGeometry;

const prismaGuessObject = {
  id: '00000000-0000-4000-8000-000000000020',
  name: 'Eiffel Tower',
  image: 'https://example.com/eiffel.jpg',
  description: 'A wrought-iron tower',
  short_description: 'Paris landmark',
  source: { provider: 'wikidata', external_id: 'Q243' },
  world_location_id: 'location-1',
} satisfies PrismaGuessObject;

type PrismaGuessObjectWithLocation = PrismaGuessObject & {
  world_location: PrismaWorldLocation;
};

type PrismaGuessObjectWithCategories = PrismaGuessObject & {
  categories: PrismaCategory[];
};

const prismaGuessObjectWithLocation = {
  ...prismaGuessObject,
  world_location: prismaWorldLocation,
} satisfies PrismaGuessObjectWithLocation;

const prismaGuessObjectWithCategories = {
  ...prismaGuessObject,
  categories: [],
} satisfies PrismaGuessObjectWithCategories;

const prismaGuessObjectWithCategory = {
  ...prismaGuessObject,
  categories: [prismaCategory],
} satisfies PrismaGuessObjectWithCategories;

const prismaFullGuessObject = {
  ...prismaGuessObject,
  world_location: {
    ...prismaWorldLocation,
    geometry: prismaWorldLocationGeometry,
  },
};

function buildGuessObjectService() {
  const prismaService = createMock<PrismaService>();
  const worldLocationService = createMock<WorldLocationService>();
  const guessObjectService = new GuessObjectService(
    prismaService,
    worldLocationService,
  );

  return { guessObjectService, prismaService, worldLocationService };
}

describe('GuessObjectService.findBy', () => {
  it('applies filters and maps results', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([
      prismaGuessObjectWithLocation,
    ]);

    const objects = await guessObjectService.findBy({
      ids: ['guess-1'],
      external_id: 'Q243',
    });

    expect(prismaService.guessObject.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['guess-1'] },
        source: { path: ['external_id'], equals: 'Q243' },
      },
      include: { world_location: true },
    });
    expect(objects).toHaveLength(1);
  });

  it('loads without optional filters', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([]);

    await guessObjectService.findBy({});

    expect(prismaService.guessObject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe('GuessObjectService.findFullBy', () => {
  it('loads geometry and maps results', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([
      prismaFullGuessObject,
    ]);

    const objects = await guessObjectService.findFullBy({
      external_id: 'Q243',
    });

    expect(objects[0]?.world_location.geometry.type).toBe('Point');
  });
});

describe('GuessObjectService.findShuffledGuessObjectsByGameConfig', () => {
  it('filters configured categories and limits the result', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([
      prismaFullGuessObject,
      { ...prismaFullGuessObject, id: 'guess-2' },
    ]);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const objects =
      await guessObjectService.findShuffledGuessObjectsByGameConfig(
        buildGameConfig({
          categories: [buildCategory()],
          nbOfObjects: 1,
        }),
      );

    expect(prismaService.guessObject.findMany).toHaveBeenCalledWith({
      where: {
        categories: {
          some: {
            id: {
              in: ['00000000-0000-4000-8000-000000000010'],
            },
          },
        },
      },
      include: { world_location: { include: { geometry: true } } },
    });
    expect(objects).toHaveLength(1);
  });

  it('does not add a category filter for an empty configuration', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([]);

    await guessObjectService.findShuffledGuessObjectsByGameConfig(
      buildGameConfig({ categories: [] }),
    );

    expect(prismaService.guessObject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe('GuessObjectService.create', () => {
  it('rejects an unknown world location', async () => {
    const { guessObjectService, worldLocationService } =
      buildGuessObjectService();
    worldLocationService.get.mockResolvedValue(null);

    await expect(
      guessObjectService.create({
        name: 'Eiffel Tower',
        world_location_id: 'missing',
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it('returns an existing object identifier', async () => {
    const { guessObjectService, prismaService, worldLocationService } =
      buildGuessObjectService();
    worldLocationService.get.mockResolvedValue({ id: 'location-1' });
    prismaService.guessObject.findFirst.mockResolvedValue(prismaGuessObject);

    const id = await guessObjectService.create({
      name: 'Eiffel Tower',
      world_location_id: 'location-1',
    });

    expect(id).toBe('00000000-0000-4000-8000-000000000020');
    expect(prismaService.guessObject.create).not.toHaveBeenCalled();
  });

  it('creates a missing object', async () => {
    const { guessObjectService, prismaService, worldLocationService } =
      buildGuessObjectService();
    worldLocationService.get.mockResolvedValue({ id: 'location-1' });
    prismaService.guessObject.findFirst.mockResolvedValue(null);
    prismaService.guessObject.create.mockResolvedValue(prismaGuessObject);

    const id = await guessObjectService.create({
      name: 'Eiffel Tower',
      description: 'A tower',
      world_location_id: 'location-1',
    });

    expect(prismaService.guessObject.create).toHaveBeenCalledWith({
      data: {
        name: 'Eiffel Tower',
        image: undefined,
        description: 'A tower',
        short_description: undefined,
        world_location_id: 'location-1',
      },
    });
    expect(id).toBe('00000000-0000-4000-8000-000000000020');
  });
});

describe('GuessObjectService.update', () => {
  it('updates fields and an explicit location', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.update.mockResolvedValue(prismaGuessObject);

    const id = await guessObjectService.update('guess-1', {
      name: 'Tower',
      world_location_id: 'location-2',
    });

    expect(prismaService.guessObject.update).toHaveBeenCalledWith({
      where: { id: 'guess-1' },
      data: {
        name: 'Tower',
        image: undefined,
        description: undefined,
        short_description: undefined,
        world_location_id: 'location-2',
      },
    });
    expect(id).toBe('00000000-0000-4000-8000-000000000020');
  });
});

describe('GuessObjectService.delete', () => {
  it('rejects a missing object', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findUnique.mockResolvedValue(null);

    await expect(guessObjectService.delete('missing')).rejects.toMatchObject({
      response: { code: ErrorCode.GUESS_OBJECTS_NOT_FOUND },
    });
  });

  it('rejects an object assigned to a category', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findUnique.mockResolvedValue(
      prismaGuessObjectWithCategory,
    );

    await expect(guessObjectService.delete('guess-1')).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
  });

  it('deletes the orphaned location after the object', async () => {
    const { guessObjectService, prismaService, worldLocationService } =
      buildGuessObjectService();
    prismaService.guessObject.findUnique.mockResolvedValue(
      prismaGuessObjectWithCategories,
    );
    prismaService.guessObject.delete.mockResolvedValue(prismaGuessObject);
    prismaService.guessObject.count.mockResolvedValue(0);
    worldLocationService.delete.mockResolvedValue(undefined);

    await guessObjectService.delete('guess-1');

    expect(worldLocationService.delete).toHaveBeenCalledWith('location-1');
  });

  it('keeps a location still referenced by another object', async () => {
    const { guessObjectService, prismaService, worldLocationService } =
      buildGuessObjectService();
    prismaService.guessObject.findUnique.mockResolvedValue(
      prismaGuessObjectWithCategories,
    );
    prismaService.guessObject.delete.mockResolvedValue(prismaGuessObject);
    prismaService.guessObject.count.mockResolvedValue(1);

    await guessObjectService.delete('guess-1');

    expect(worldLocationService.delete).not.toHaveBeenCalled();
  });
});

describe('GuessObjectService.searchDraftByName', () => {
  it('performs a case-insensitive search and maps drafts', async () => {
    const { guessObjectService, prismaService } = buildGuessObjectService();
    prismaService.guessObject.findMany.mockResolvedValue([prismaGuessObject]);

    const drafts = await guessObjectService.searchDraftByName('tower');

    expect(prismaService.guessObject.findMany).toHaveBeenCalledWith({
      where: { name: { contains: 'tower', mode: 'insensitive' } },
    });
    expect(drafts[0]?.name).toBe('Eiffel Tower');
  });
});
