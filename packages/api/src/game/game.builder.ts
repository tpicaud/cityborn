import type { z } from 'zod';
import {
  defaultGameConfig,
  type Game,
  type GameConfig,
  GameConfigSchema,
  GameSchema,
  type GameState,
  GameStateSchema,
  GameStatus,
  type Guess,
  GuessSchema,
  type Round,
  RoundSchema,
  RoundStatus,
} from './game.schema';

export function buildGameConfig(
  overrides: Partial<z.input<typeof GameConfigSchema>> = {},
): GameConfig {
  return GameConfigSchema.parse({ ...defaultGameConfig, ...overrides });
}

export function buildGame(
  overrides: Partial<z.input<typeof GameSchema>> = {},
): Game {
  return GameSchema.parse({
    id: 'game-1',
    config: buildGameConfig(),
    status: GameStatus.IN_GAME,
    state: { guessObjectsIds: [], results: {} },
    ...overrides,
  });
}

export function buildGuess(
  overrides: Partial<z.input<typeof GuessSchema>> = {},
): Guess {
  return GuessSchema.parse({
    coordinates: { lat: 48.85, lng: 2.35 },
    distance: 120,
    points: 887,
    win: false,
    ...overrides,
  });
}

export function buildRound(
  overrides: Partial<z.input<typeof RoundSchema>> = {},
): Round {
  return RoundSchema.parse({
    status: RoundStatus.GUESSING,
    guessObjectId: 'guess-object-1',
    ...overrides,
  });
}

export function buildGameState(
  overrides: Partial<z.input<typeof GameStateSchema>> = {},
): GameState {
  return GameStateSchema.parse({
    guessObjectsIds: [],
    results: {},
    ...overrides,
  });
}
