import {
  buildTheme,
  type FullPack,
  type Pack,
  type PackTree,
  type Theme,
} from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  Pack as PrismaPack,
  WorldLocation as PrismaWorldLocation,
} from '@prisma/client';
import { PackMapper, type PrismaPackNode } from './pack.mapper';

const theme: Theme = buildTheme();

describe('PackMapper.toPack', () => {
  it('maps nullable values to optional contract fields', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const pack: Pack = PackMapper.toPack(prismaPack);

    expect(pack).toEqual({
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: undefined,
      parentId: undefined,
      themeId: theme.id,
    });
  });
});

describe('PackMapper.toPacks', () => {
  it('maps every pack', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const input: PrismaPack[] = [
      prismaPack,
      { ...prismaPack, id: 'pack-2', name: 'Museums' },
    ];

    const packs: Pack[] = PackMapper.toPacks(input);

    expect(packs.map(({ id, name }) => ({ id, name }))).toEqual([
      {
        id: '00000000-0000-4000-8000-000000000010',
        name: 'Monuments',
      },
      { id: 'pack-2', name: 'Museums' },
    ]);
  });
});

describe('PackMapper.toFullPack', () => {
  it('maps loaded guess objects', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const prismaWorldLocation: PrismaWorldLocation = {
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

    const prismaGuessObject: PrismaGuessObject = {
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Eiffel Tower',
      image: 'https://example.com/eiffel.jpg',
      description: 'A wrought-iron tower',
      short_description: 'Paris landmark',
      source: { provider: 'wikidata', external_id: 'Q243' },
      world_location_id: 'location-1',
    };

    const input: Parameters<typeof PackMapper.toFullPack>[0] = {
      ...prismaPack,
      description: 'Places to visit',
      parentId: '00000000-0000-4000-8000-000000000011',
      guessObjects: [
        { ...prismaGuessObject, world_location: prismaWorldLocation },
      ],
    };

    const pack: FullPack = PackMapper.toFullPack(input);

    expect(pack).toMatchObject({
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
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const pack: FullPack = PackMapper.toFullPack(prismaPack);

    expect(pack.guessObjects).toEqual([]);
  });
});

describe('PackMapper.toFullPacks', () => {
  it('maps every full pack', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const prismaWorldLocation: PrismaWorldLocation = {
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

    const prismaGuessObject: PrismaGuessObject = {
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Eiffel Tower',
      image: 'https://example.com/eiffel.jpg',
      description: 'A wrought-iron tower',
      short_description: 'Paris landmark',
      source: { provider: 'wikidata', external_id: 'Q243' },
      world_location_id: 'location-1',
    };

    const input: Parameters<typeof PackMapper.toFullPacks>[0] = [
      { ...prismaPack, guessObjects: [] },
      {
        ...prismaPack,
        id: 'pack-2',
        guessObjects: [
          { ...prismaGuessObject, world_location: prismaWorldLocation },
        ],
      },
    ];

    const packs: FullPack[] = PackMapper.toFullPacks(input);

    expect(
      packs.map(({ id, guessObjects }) => [id, guessObjects.length]),
    ).toEqual([
      ['00000000-0000-4000-8000-000000000010', 0],
      ['pack-2', 1],
    ]);
  });
});

describe('PackMapper.toPackTree', () => {
  it('maps nested children recursively', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const child: PrismaPackNode = {
      ...prismaPack,
      id: 'pack-child',
      name: 'Landmarks',
      parentId: '00000000-0000-4000-8000-000000000010',
      children: [],
    };
    const root: PrismaPackNode = {
      ...prismaPack,
      children: [child],
    };

    const tree: PackTree = PackMapper.toPackTree(root);

    expect(tree.children).toEqual([
      {
        id: 'pack-child',
        name: 'Landmarks',
        isPublished: true,
        description: undefined,
        parentId: '00000000-0000-4000-8000-000000000010',
        themeId: theme.id,
        children: [],
      },
    ]);
  });
});

describe('PackMapper.toPackTrees', () => {
  it('maps every root tree', () => {
    const prismaPack: PrismaPack = {
      id: '00000000-0000-4000-8000-000000000010',
      name: 'Monuments',
      isPublished: true,
      description: null,
      parentId: null,
      themeId: theme.id,
    };

    const roots: PrismaPackNode[] = [
      { ...prismaPack, children: [] },
      { ...prismaPack, id: 'pack-2', children: [] },
    ];

    const trees: PackTree[] = PackMapper.toPackTrees(roots);

    expect(trees.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'pack-2',
    ]);
  });
});
