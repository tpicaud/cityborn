import type { z } from 'zod';
import { buildGameConfig } from '../game/game.builder';
import { buildPlayer } from '../player/player.builder';
import { SessionMode } from '../session/session.schema';
import {
  type CreateGameRecord,
  CreateGameRecordSchema,
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
