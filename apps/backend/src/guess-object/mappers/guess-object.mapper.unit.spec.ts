import {
  buildWorldLocation,
  GuessObjectDraftSchema,
  GuessObjectSchema,
} from '@cityborn/api';
import {
  buildPrismaGuessObject,
  buildPrismaGuessObjectWithLocation,
  buildPrismaWorldLocation,
  buildPrismaWorldLocationGeometry,
} from '../../../test/support/fixtures';
import { GuessObjectMapper } from './guess-object.mapper';

describe('GuessObjectMapper.toGuessObject', () => {
  it('maps the object and its location preview', () => {
    const guessObject = GuessObjectMapper.toGuessObject(
      buildPrismaGuessObjectWithLocation(),
    );

    expect(() => GuessObjectSchema.parse(guessObject)).not.toThrow();
    expect(guessObject.world_location_preview).toEqual({
      id: 'location-1',
      name: 'Paris',
      display_name: 'Paris, France',
    });
  });

  it('omits nullable optional values', () => {
    const guessObject = GuessObjectMapper.toGuessObject(
      buildPrismaGuessObjectWithLocation({
        image: null,
        description: null,
        short_description: null,
        source: null,
      }),
    );

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
      ...buildPrismaGuessObject(),
      world_location: {
        ...buildPrismaWorldLocation(),
        geometry: buildPrismaWorldLocationGeometry(),
      },
    });

    expect(guessObject.world_location).toEqual(buildWorldLocation());
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
    const draft = GuessObjectMapper.toGuessObjectDraftFromPrisma(
      buildPrismaGuessObject(),
    );

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
