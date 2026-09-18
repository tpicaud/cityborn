import type {
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
} from '@cityborn/api';
import { GuessObjectDraftSchema, GuessObjectSchema } from '@cityborn/api';
import type {
  GuessObject as PrismaGuessObject,
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import type { WikidataItemResponse } from '../../wikidata/wikidata.service';
import type { PrismaGuessObjectWithFullLocation } from './guess-object.mapper';
import { GuessObjectMapper } from './guess-object.mapper';

describe('GuessObjectMapper.toGuessObject', () => {
  it('maps the object and its location preview', () => {
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

    const input: Parameters<typeof GuessObjectMapper.toGuessObject>[0] = {
      ...prismaGuessObject,
      world_location: prismaWorldLocation,
    };

    const guessObject: GuessObject = GuessObjectMapper.toGuessObject(input);

    expect(() => GuessObjectSchema.parse(guessObject)).not.toThrow();
    expect(guessObject.world_location_preview).toEqual({
      id: 'location-1',
      name: 'Paris',
      display_name: 'Paris, France',
    });
  });

  it('omits nullable optional values', () => {
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

    const input: Parameters<typeof GuessObjectMapper.toGuessObject>[0] = {
      ...prismaGuessObject,
      image: null,
      description: null,
      short_description: null,
      source: null,
      world_location: prismaWorldLocation,
    };

    const guessObject: GuessObject = GuessObjectMapper.toGuessObject(input);

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

    const prismaWorldLocationGeometry: PrismaWorldLocationGeometry = {
      id: 'geometry-1',
      data: { type: 'Point', coordinates: [2.3522, 48.8566] },
      world_location_id: 'location-1',
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

    const input: PrismaGuessObjectWithFullLocation = {
      ...prismaGuessObject,
      world_location: {
        ...prismaWorldLocation,
        geometry: prismaWorldLocationGeometry,
      },
    };

    const guessObject: FullGuessObject =
      GuessObjectMapper.toFullGuessObject(input);

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
    const input: WikidataItemResponse = {
      id: 'Q243',
      label: 'Eiffel Tower',
      description: 'A wrought-iron tower',
    };

    const draft: GuessObjectDraft = GuessObjectMapper.toGuessObjectDraft(input);

    expect(() => GuessObjectDraftSchema.parse(draft)).not.toThrow();
    expect(draft.source?.external_id).toBe('Q243');
  });

  it('omits absent optional values', () => {
    const input: WikidataItemResponse = {
      id: 'Q243',
      label: 'Eiffel Tower',
    };

    const draft: GuessObjectDraft = GuessObjectMapper.toGuessObjectDraft(input);

    expect(draft.description).toBeUndefined();
    expect(draft.image).toBeUndefined();
  });
});

describe('GuessObjectMapper.toGuessObjectDraftFromPrisma', () => {
  it('maps persisted data', () => {
    const prismaGuessObject: PrismaGuessObject = {
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Eiffel Tower',
      image: 'https://example.com/eiffel.jpg',
      description: 'A wrought-iron tower',
      short_description: 'Paris landmark',
      source: { provider: 'wikidata', external_id: 'Q243' },
      world_location_id: 'location-1',
    };

    const draft: GuessObjectDraft =
      GuessObjectMapper.toGuessObjectDraftFromPrisma(prismaGuessObject);

    expect(draft).toMatchObject({
      id: '00000000-0000-4000-8000-000000000020',
      name: 'Eiffel Tower',
      source: { external_id: 'Q243' },
    });
  });
});

describe('GuessObjectMapper.toGuessObjectsSearchResponse', () => {
  it('maps every Wikidata result', () => {
    const input: Parameters<
      typeof GuessObjectMapper.toGuessObjectsSearchResponse
    >[0] = {
      results: [
        { id: 'Q243', label: 'Eiffel Tower' },
        { id: 'Q90', label: 'Paris' },
      ],
    };

    const drafts: GuessObjectDraft[] =
      GuessObjectMapper.toGuessObjectsSearchResponse(input);

    expect(drafts.map(({ source }) => source?.external_id)).toEqual([
      'Q243',
      'Q90',
    ]);
  });
});
