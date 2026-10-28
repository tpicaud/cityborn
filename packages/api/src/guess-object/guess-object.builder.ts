import type { z } from 'zod';
import { buildWorldLocation } from '../world-location/world-location.builder';
import {
  BaseGuessObjectSchema,
  type FullGuessObject,
  FullGuessObjectSchema,
  type GuessObject,
  type GuessObjectDraft,
  GuessObjectDraftSchema,
  GuessObjectSchema,
  type GuessObjectWithoutLocation,
} from './guess-object.schema';

export function buildGuessObject(
  overrides: Partial<z.input<typeof GuessObjectSchema>> = {},
): GuessObject {
  const worldLocation = buildWorldLocation();

  return GuessObjectSchema.parse({
    id: '00000000-0000-4000-8000-000000000020',
    name: 'Eiffel Tower',
    image: 'https://example.com/eiffel.jpg',
    description: 'A wrought-iron tower',
    short_description: 'Paris landmark',
    source: { provider: 'wikidata', external_id: 'Q243' },
    world_location_preview: {
      id: worldLocation.id,
      name: worldLocation.name,
      display_name: worldLocation.display_name,
    },
    ...overrides,
  });
}

export function buildFullGuessObject(
  overrides: Partial<z.input<typeof FullGuessObjectSchema>> = {},
): FullGuessObject {
  const guessObject = buildGuessObject();

  return FullGuessObjectSchema.parse({
    id: guessObject.id,
    name: guessObject.name,
    image: guessObject.image,
    description: guessObject.description,
    short_description: guessObject.short_description,
    source: guessObject.source,
    world_location: buildWorldLocation(),
    ...overrides,
  });
}

export function buildGuessObjectWithoutLocation(
  overrides: Partial<z.input<typeof BaseGuessObjectSchema>> = {},
): GuessObjectWithoutLocation {
  const guessObject: GuessObject = buildGuessObject();

  return BaseGuessObjectSchema.parse({
    id: guessObject.id,
    name: guessObject.name,
    image: guessObject.image,
    description: guessObject.description,
    short_description: guessObject.short_description,
    source: guessObject.source,
    ...overrides,
  });
}

export function buildGuessObjectDraft(
  overrides: Partial<z.input<typeof GuessObjectDraftSchema>> = {},
): GuessObjectDraft {
  const guessObject = buildGuessObject();

  return GuessObjectDraftSchema.parse({
    name: guessObject.name,
    image: guessObject.image,
    description: guessObject.description,
    short_description: guessObject.short_description,
    source: guessObject.source,
    ...overrides,
  });
}
