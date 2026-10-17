import type { z } from 'zod';
import { buildGameConfig } from '../game/game.builder';
import { buildPlayer } from '../player/player.builder';
import { SessionMode } from '../session/session.schema';
import {
  type CreateGameRecord,
  CreateGameRecordSchema,
  type GameRecord,
  GameRecordSchema,
} from './game-record.schema';

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

export function buildGameRecord(
  overrides: Partial<z.input<typeof GameRecordSchema>> = {},
): GameRecord {
  return GameRecordSchema.parse({
    id: 'game-record-1',
    createdAt: '2026-09-13T10:00:00.000Z',
    ...buildCreateGameRecord(),
    ...overrides,
  });
}
