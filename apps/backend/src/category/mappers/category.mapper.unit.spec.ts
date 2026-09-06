import {
  buildPrismaCategory,
  buildPrismaCategoryWithGuessObjects,
  buildPrismaGuessObjectWithLocation,
} from '../../../test/support/fixtures';
import type { PrismaCategoryNode } from '../services/category.service';
import { CategoryMapper } from './category.mapper';

describe('CategoryMapper.toCategory', () => {
  it('maps nullable values to optional contract fields', () => {
    const category = CategoryMapper.toCategory(buildPrismaCategory());

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
      buildPrismaCategory(),
      buildPrismaCategory({ id: 'category-2', name: 'Museums' }),
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
    const category = CategoryMapper.toFullCategory(
      buildPrismaCategoryWithGuessObjects({
        description: 'Places to visit',
        parentId: '00000000-0000-4000-8000-000000000011',
        guessObjects: [buildPrismaGuessObjectWithLocation()],
      }),
    );

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
    const category = CategoryMapper.toFullCategory(buildPrismaCategory());

    expect(category.guessObjects).toEqual([]);
  });
});

describe('CategoryMapper.toFullCategories', () => {
  it('maps every full category', () => {
    const categories = CategoryMapper.toFullCategories([
      buildPrismaCategoryWithGuessObjects(),
      buildPrismaCategoryWithGuessObjects({
        id: 'category-2',
        guessObjects: [buildPrismaGuessObjectWithLocation()],
      }),
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
      ...buildPrismaCategory({
        id: 'category-child',
        name: 'Landmarks',
        parentId: '00000000-0000-4000-8000-000000000010',
      }),
      children: [],
    };
    const root: PrismaCategoryNode = {
      ...buildPrismaCategory(),
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
      { ...buildPrismaCategory(), children: [] },
      { ...buildPrismaCategory({ id: 'category-2' }), children: [] },
    ];

    const trees = CategoryMapper.toCategoryTrees(roots);

    expect(trees.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'category-2',
    ]);
  });
});
