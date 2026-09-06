import { GuessObjectDraftSchema, GuessObjectSchema } from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import { GuessObjectMapper } from './guess-object.mapper';

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

describe('GuessObjectMapper.toGuessObject', () => {
  it('maps the object and its location preview', () => {
    const guessObject = GuessObjectMapper.toGuessObject({
      ...prismaGuessObject,
      world_location: prismaWorldLocation,
    });

    expect(() => GuessObjectSchema.parse(guessObject)).not.toThrow();
    expect(guessObject.world_location_preview).toEqual({
      id: 'location-1',
      name: 'Paris',
      display_name: 'Paris, France',
    });
  });

  it('omits nullable optional values', () => {
    const guessObject = GuessObjectMapper.toGuessObject({
      ...prismaGuessObject,
      image: null,
      description: null,
      short_description: null,
      source: null,
      world_location: prismaWorldLocation,
    });

    expect(guessObject).toMatchObject({
      image: undefined,
      description: undefined,
      short_description: undefined,
      source: undefined,
    });
  });
});

describe('GuessObjectMapper.toFullGuessObject', () => {
  it('maps a full world location', () => {
    const guessObject = GuessObjectMapper.toFullGuessObject({
      ...prismaGuessObject,
      world_location: {
        ...prismaWorldLocation,
        geometry: prismaWorldLocationGeometry,
      },
    });

    expect(guessObject.world_location).toEqual({
      id: 'location-1',
      osm_type: 'relation',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      centroid: [48.8566, 2.3522],
      source: { provider: 'nominatim', external_id: '7444' },
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    });
  });
});

describe('GuessObjectMapper.toGuessObjectDraft', () => {
  it('maps a Wikidata response', () => {
    const draft = GuessObjectMapper.toGuessObjectDraft({
      id: 'Q243',
      label: 'Eiffel Tower',
      description: 'A wrought-iron tower',
    });

    expect(() => GuessObjectDraftSchema.parse(draft)).not.toThrow();
    expect(draft.source?.external_id).toBe('Q243');
  });

  it('omits absent optional values', () => {
    const draft = GuessObjectMapper.toGuessObjectDraft({
      id: 'Q243',
      label: 'Eiffel Tower',
    });

    expect(draft.description).toBeUndefined();
    expect(draft.image).toBeUndefined();
  });
});

describe('GuessObjectMapper.toGuessObjectDraftFromPrisma', () => {
  it('maps persisted data', () => {
    const draft =
      GuessObjectMapper.toGuessObjectDraftFromPrisma(prismaGuessObject);

    expect(draft).toMatchObject({
      name: 'Eiffel Tower',
      source: { external_id: 'Q243' },
    });
  });
});

describe('GuessObjectMapper.toGuessObjectsSearchResponse', () => {
  it('maps every Wikidata result', () => {
    const drafts = GuessObjectMapper.toGuessObjectsSearchResponse({
      results: [
        { id: 'Q243', label: 'Eiffel Tower' },
        { id: 'Q90', label: 'Paris' },
      ],
    });

    expect(drafts.map(({ source }) => source?.external_id)).toEqual([
      'Q243',
      'Q90',
    ]);
  });
});
