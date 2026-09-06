import type {
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
} from '../schemas/guess-object.schema';
import { buildWorldLocation } from './world-location.builder';

export function buildGuessObject(
  overrides: Partial<GuessObject> = {},
): GuessObject {
  const worldLocation = buildWorldLocation();

  return structuredClone({
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
  overrides: Partial<FullGuessObject> = {},
): FullGuessObject {
  const guessObject = buildGuessObject();

  return structuredClone({
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

export function buildGuessObjectDraft(
  overrides: Partial<GuessObjectDraft> = {},
): GuessObjectDraft {
  const guessObject = buildGuessObject();

  return structuredClone({
    name: guessObject.name,
    image: guessObject.image,
    description: guessObject.description,
    short_description: guessObject.short_description,
    source: guessObject.source,
    ...overrides,
  });
}
