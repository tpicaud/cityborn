import type { z } from 'zod';
import { GameStatus, RoundStatus, SessionMode } from '../schemas/enums';
import {
  type CreateGameRecord,
  CreateGameRecordSchema,
  defaultGameConfig,
  type Game,
  type GameConfig,
  GameConfigSchema,
  GameSchema,
  type GameState,
  GameStateSchema,
  type Round,
  RoundSchema,
} from '../schemas/game.schema';
import { buildPlayer } from './player.builder';

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

export function buildCreateGameRecord(
  overrides: Partial<z.input<typeof CreateGameRecordSchema>> = {},
): CreateGameRecord {
  const player = buildPlayer();

  return CreateGameRecordSchema.parse({
    mode: SessionMode.SOLO,
    gameConfig: buildGameConfig(),
    players: [player],
    guessObjectsIds: [],
    results: { [player.username]: { results: [] } },
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
