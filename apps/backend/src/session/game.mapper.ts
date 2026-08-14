import {
  GameConfigSchema,
  GameRecord,
  PlayerResults,
  PlayerSchema,
  SessionMode,
} from '@cityborn/api';
import type { GameRecord as PrismaGameRecord } from '@prisma/client';
import { z } from 'zod';
export const GameMapper = {
  toGameRecord(gameRecords: PrismaGameRecord[]): GameRecord[] {
    return gameRecords.map((record) => ({
      id: record.id,
      mode: record.mode as SessionMode,
      gameConfig: GameConfigSchema.parse(record.gameConfig),
      players: z.array(PlayerSchema).parse(record.players),
      guessObjectsIds: record.guessObjectsIds,
      results: record.results as unknown as Record<string, PlayerResults>,
      createdAt: record.createdAt.toISOString().split('T')[0],
    }));
  },
};
