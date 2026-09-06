import {
  type Category,
  type EndGameSentence,
  GameMode,
  type GameRecord,
  type GuessObject,
  ScoreType,
  type User,
  type WorldLocation,
  type WorldLocationGeometry,
} from '@prisma/client';

export function buildPrismaCategory(
  overrides: Partial<Category> = {},
): Category {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Monuments',
    isPublished: true,
    description: null,
    parentId: null,
    ...overrides,
  });
}

export function buildPrismaWorldLocation(
  overrides: Partial<WorldLocation> = {},
): WorldLocation {
  return structuredClone({
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
    ...overrides,
  });
}

export function buildPrismaWorldLocationGeometry(
  overrides: Partial<WorldLocationGeometry> = {},
): WorldLocationGeometry {
  return structuredClone({
    id: 'geometry-1',
    data: { type: 'Point', coordinates: [2.3522, 48.8566] },
    world_location_id: 'location-1',
    ...overrides,
  });
}

export function buildPrismaGuessObject(
  overrides: Partial<GuessObject> = {},
): GuessObject {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000020',
    name: 'Eiffel Tower',
    image: 'https://example.com/eiffel.jpg',
    description: 'A wrought-iron tower',
    short_description: 'Paris landmark',
    source: { provider: 'wikidata', external_id: 'Q243' },
    world_location_id: 'location-1',
    ...overrides,
  });
}

export function buildPrismaEndGameSentence(
  overrides: Partial<EndGameSentence> = {},
): EndGameSentence {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000030',
    message: 'Excellent score!',
    score_type: ScoreType.GOOD,
    ...overrides,
  });
}

export function buildPrismaGameRecord(
  overrides: Partial<GameRecord> = {},
): GameRecord {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000040',
    mode: GameMode.solo,
    gameConfig: {
      categories: [],
      timer: 25,
      nbOfObjects: 6,
    },
    players: [],
    guessObjectsIds: [],
    results: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

export function buildPrismaUser(overrides: Partial<User> = {}): User {
  return structuredClone({
    id: '00000000-0000-4000-8000-000000000001',
    email: 'host@cityborn.test',
    username: 'host',
    type: 'email',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    isVerified: true,
    appleId: null,
    ...overrides,
  });
}

export type PrismaGuessObjectWithLocation = GuessObject & {
  world_location: WorldLocation;
};

export function buildPrismaGuessObjectWithLocation(
  overrides: Partial<PrismaGuessObjectWithLocation> = {},
): PrismaGuessObjectWithLocation {
  return structuredClone({
    ...buildPrismaGuessObject(),
    world_location: buildPrismaWorldLocation(),
    ...overrides,
  });
}

export type PrismaCategoryWithGuessObjects = Category & {
  guessObjects: PrismaGuessObjectWithLocation[];
};

export function buildPrismaCategoryWithGuessObjects(
  overrides: Partial<PrismaCategoryWithGuessObjects> = {},
): PrismaCategoryWithGuessObjects {
  return structuredClone({
    ...buildPrismaCategory(),
    guessObjects: [],
    ...overrides,
  });
}
export type PrismaWorldLocationWithGeometry = WorldLocation & {
  geometry: WorldLocationGeometry;
};

export function buildPrismaWorldLocationWithGeometry(
  overrides: Partial<PrismaWorldLocationWithGeometry> = {},
): PrismaWorldLocationWithGeometry {
  return structuredClone({
    ...buildPrismaWorldLocation(),
    geometry: buildPrismaWorldLocationGeometry(),
    ...overrides,
  });
}

export type PrismaGuessObjectWithCategories = GuessObject & {
  categories: Category[];
};

export function buildPrismaGuessObjectWithCategories(
  overrides: Partial<PrismaGuessObjectWithCategories> = {},
): PrismaGuessObjectWithCategories {
  return structuredClone({
    ...buildPrismaGuessObject(),
    categories: [],
    ...overrides,
  });
}

export type PrismaUserWithGameRecords = User & {
  gameRecords: GameRecord[];
};

export function buildPrismaUserWithGameRecords(
  overrides: Partial<PrismaUserWithGameRecords> = {},
): PrismaUserWithGameRecords {
  return structuredClone({
    ...buildPrismaUser(),
    gameRecords: [],
    ...overrides,
  });
}
