import {
  buildCreateCategory,
  buildUpdateCategory,
  ErrorCode,
} from '@cityborn/api';
import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
} from '@prisma/client';
import { createMock } from '../../../test/support/createMock';
import type { GuessObjectService } from '../../guess-object/guess-object.service';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  CategoryService,
  type PrismaCategoryWithFullGuessObjects,
} from './category.service';

function buildPrismaCategory(
  overrides: Partial<PrismaCategory> = {},
): PrismaCategory {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Monuments',
    isPublished: true,
    description: null,
    parentId: null,
    ...overrides,
  };
}

function buildPrismaWorldLocation(): PrismaWorldLocation {
  return {
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
  };
}

function buildPrismaGuessObject(
  overrides: Partial<PrismaGuessObject> = {},
): PrismaGuessObject & { world_location: PrismaWorldLocation } {
  return {
    id: '00000000-0000-4000-8000-000000000020',
    name: 'Eiffel Tower',
    image: null,
    description: null,
    short_description: null,
    source: { provider: 'wikidata', external_id: 'Q243' },
    world_location_id: 'location-1',
    world_location: buildPrismaWorldLocation(),
    ...overrides,
  };
}

function buildFullPrismaCategory(
  guessObjects: PrismaCategoryWithFullGuessObjects['guessObjects'] = [],
): PrismaCategoryWithFullGuessObjects {
  return { ...buildPrismaCategory(), guessObjects };
}

function buildCategoryService() {
  const prismaService = createMock<PrismaService>();
  const guessObjectService = createMock<GuessObjectService>();
  const categoryService = new CategoryService(
    prismaService,
    guessObjectService,
  );

  return { categoryService, prismaService, guessObjectService };
}

describe('CategoryService.findTree', () => {
  it('loads root categories with nested children', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findTree({});

    expect(prismaService.category.findMany).toHaveBeenCalledWith({
      where: { parentId: null },
      include: expect.objectContaining({ children: expect.any(Object) }),
    });
  });

  it('filters roots by publication state', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findTree({ isPublished: false });

    expect(prismaService.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId: null, isPublished: false },
      }),
    );
  });
});

describe('CategoryService.findAll', () => {
  it('loads every category', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([buildPrismaCategory()]);

    const categories = await categoryService.findAll();

    expect(categories).toHaveLength(1);
    expect(prismaService.category.findMany).toHaveBeenCalledWith();
  });
});

describe('CategoryService.findBy', () => {
  it('applies ids and publication filters', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findBy({
      ids: ['category-1'],
      isPublished: true,
    });

    expect(prismaService.category.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['category-1'] }, isPublished: true },
    });
  });

  it('loads without optional filters', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findBy({});

    expect(prismaService.category.findMany).toHaveBeenCalledWith({ where: {} });
  });
});

describe('CategoryService.findFullBy', () => {
  it('loads guess objects and their locations', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findFullBy({
      ids: ['category-1'],
      isPublished: false,
    });

    expect(prismaService.category.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['category-1'] }, isPublished: false },
      include: { guessObjects: { include: { world_location: true } } },
    });
  });

  it('loads without optional filters', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await categoryService.findFullBy({});

    expect(prismaService.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});

describe('CategoryService.create', () => {
  it('connects existing guess objects', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.create.mockResolvedValue(buildPrismaCategory());

    await categoryService.create(
      buildCreateCategory({
        guessObjectsIds: ['guess-1', 'guess-2'],
      }),
    );

    expect(prismaService.category.create).toHaveBeenCalledWith({
      data: {
        name: 'Monuments',
        isPublished: true,
        guessObjects: {
          connect: [{ id: 'guess-1' }, { id: 'guess-2' }],
        },
      },
    });
  });

  it('creates without guess object relations', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.create.mockResolvedValue(buildPrismaCategory());

    await categoryService.create(buildCreateCategory({ isPublished: false }));

    expect(prismaService.category.create).toHaveBeenCalledWith({
      data: {
        name: 'Monuments',
        isPublished: false,
        guessObjects: undefined,
      },
    });
  });
});

describe('CategoryService.update', () => {
  it('updates relations and deletes only newly orphaned guess objects', async () => {
    const { categoryService, prismaService, guessObjectService } =
      buildCategoryService();
    prismaService.category.update.mockResolvedValue(buildPrismaCategory());
    prismaService.category.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    guessObjectService.delete.mockResolvedValue(undefined);

    await categoryService.update(
      'category-1',
      buildUpdateCategory({
        id: 'category-1',
        connectIds: ['guess-connected'],
        disconnectIds: ['guess-orphan', 'guess-shared'],
      }),
    );

    expect(prismaService.category.update).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      data: {
        name: 'Monuments',
        isPublished: true,
        guessObjects: {
          connect: [{ id: 'guess-connected' }],
          disconnect: [{ id: 'guess-orphan' }, { id: 'guess-shared' }],
        },
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith('guess-orphan');
  });

  it('updates fields without relation changes', async () => {
    const { categoryService, prismaService, guessObjectService } =
      buildCategoryService();
    prismaService.category.update.mockResolvedValue(buildPrismaCategory());

    await categoryService.update(
      'category-1',
      buildUpdateCategory({ id: 'category-1', name: 'Landmarks' }),
    );

    expect(prismaService.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Landmarks', isPublished: true },
      }),
    );
    expect(prismaService.category.count).not.toHaveBeenCalled();
    expect(guessObjectService.delete).not.toHaveBeenCalled();
  });

  it('does not scan orphans for an empty disconnection list', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.update.mockResolvedValue(buildPrismaCategory());

    await categoryService.update(
      'category-1',
      buildUpdateCategory({ id: 'category-1', disconnectIds: [] }),
    );

    expect(prismaService.category.count).not.toHaveBeenCalled();
  });
});

describe('CategoryService.delete', () => {
  it('rejects when the category does not exist', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([]);

    await expect(categoryService.delete('missing')).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_NOT_FOUND },
    });
  });

  it('rejects when the category has children', async () => {
    const { categoryService, prismaService } = buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([
      buildFullPrismaCategory(),
    ]);
    prismaService.category.count.mockResolvedValue(1);

    await expect(categoryService.delete('category-1')).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_HAS_CHILDREN },
    });
    expect(prismaService.category.delete).not.toHaveBeenCalled();
  });

  it('deletes the category and only its orphaned guess objects', async () => {
    const { categoryService, prismaService, guessObjectService } =
      buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([
      buildFullPrismaCategory([
        buildPrismaGuessObject({ id: 'guess-orphan' }),
        buildPrismaGuessObject({ id: 'guess-shared' }),
      ]),
    ]);
    prismaService.category.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    prismaService.category.delete.mockResolvedValue(buildPrismaCategory());
    guessObjectService.delete.mockResolvedValue(undefined);

    await categoryService.delete('category-1');

    expect(prismaService.category.delete).toHaveBeenCalledWith({
      where: { id: 'category-1' },
    });
    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith('guess-orphan');
  });

  it('deletes a category without guess objects', async () => {
    const { categoryService, prismaService, guessObjectService } =
      buildCategoryService();
    prismaService.category.findMany.mockResolvedValue([
      buildFullPrismaCategory(),
    ]);
    prismaService.category.count.mockResolvedValue(0);
    prismaService.category.delete.mockResolvedValue(buildPrismaCategory());

    await categoryService.delete('category-1');

    expect(guessObjectService.delete).not.toHaveBeenCalled();
  });
});
