import type {
  Category as PrismaCategory,
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
} from '@prisma/client';
import type { PrismaCategoryNode } from '../services/category.service';
import { CategoryMapper } from './category.mapper';

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

const prismaGuessObject = {
  id: '00000000-0000-4000-8000-000000000020',
  name: 'Eiffel Tower',
  image: 'https://example.com/eiffel.jpg',
  description: 'A wrought-iron tower',
  short_description: 'Paris landmark',
  source: { provider: 'wikidata', external_id: 'Q243' },
  world_location_id: 'location-1',
} satisfies PrismaGuessObject;

describe('CategoryMapper.toCategory', () => {
  it('maps nullable values to optional contract fields', () => {
    const category = CategoryMapper.toCategory(prismaCategory);

    expect(category).toEqual({
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: undefined,
      parentId: undefined,
    });
  });
});

describe('CategoryMapper.toCategories', () => {
  it('maps every category', () => {
    const categories = CategoryMapper.toCategories([
      prismaCategory,
      { ...prismaCategory, id: 'category-2', name: 'Museums' },
    ]);

    expect(categories.map(({ id, name }) => ({ id, name }))).toEqual([
      {
        id: '00000000-0000-4000-8000-000000000010',
        name: 'Monuments',
      },
      { id: 'category-2', name: 'Museums' },
    ]);
  });
});

describe('CategoryMapper.toFullCategory', () => {
  it('maps loaded guess objects', () => {
    const category = CategoryMapper.toFullCategory({
      ...prismaCategory,
      description: 'Places to visit',
      parentId: '00000000-0000-4000-8000-000000000011',
      guessObjects: [
        { ...prismaGuessObject, world_location: prismaWorldLocation },
      ],
    });

    expect(category).toMatchObject({
      description: 'Places to visit',
      parentId: '00000000-0000-4000-8000-000000000011',
      guessObjects: [
        {
          id: '00000000-0000-4000-8000-000000000020',
          world_location_preview: { id: 'location-1', name: 'Paris' },
        },
      ],
    });
  });

  it('returns an empty list when relations are not loaded', () => {
    const category = CategoryMapper.toFullCategory(prismaCategory);

    expect(category.guessObjects).toEqual([]);
  });
});

describe('CategoryMapper.toFullCategories', () => {
  it('maps every full category', () => {
    const categories = CategoryMapper.toFullCategories([
      { ...prismaCategory, guessObjects: [] },
      {
        ...prismaCategory,
        id: 'category-2',
        guessObjects: [
          { ...prismaGuessObject, world_location: prismaWorldLocation },
        ],
      },
    ]);

    expect(
      categories.map(({ id, guessObjects }) => [id, guessObjects.length]),
    ).toEqual([
      ['00000000-0000-4000-8000-000000000010', 0],
      ['category-2', 1],
    ]);
  });
});

describe('CategoryMapper.toCategoryTree', () => {
  it('maps nested children recursively', () => {
    const child: PrismaCategoryNode = {
      ...prismaCategory,
      id: 'category-child',
      name: 'Landmarks',
      parentId: '00000000-0000-4000-8000-000000000010',
      children: [],
    };
    const root: PrismaCategoryNode = {
      ...prismaCategory,
      children: [child],
    };

    const tree = CategoryMapper.toCategoryTree(root);

    expect(tree.children).toEqual([
      {
        id: 'category-child',
        name: 'Landmarks',
        isPublished: true,
        description: undefined,
        parentId: '00000000-0000-4000-8000-000000000010',
        children: [],
      },
    ]);
  });
});

describe('CategoryMapper.toCategoryTrees', () => {
  it('maps every root tree', () => {
    const roots: PrismaCategoryNode[] = [
      { ...prismaCategory, children: [] },
      { ...prismaCategory, id: 'category-2', children: [] },
    ];

    const trees = CategoryMapper.toCategoryTrees(roots);

    expect(trees.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'category-2',
    ]);
  });
});
