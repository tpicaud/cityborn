import { type GameRecord, GameRecordSchema } from '@cityborn/api';
import type { GameRecord as PrismaGameRecord } from '@prisma/client';

export const GameMapper = {
  toGameRecord(gameRecords: PrismaGameRecord[]): GameRecord[] {
    return gameRecords.map((record) =>
      GameRecordSchema.parse({
        id: record.id,
        mode: record.mode,
        gameConfig: record.gameConfig,
        players: record.players,
        guessObjectsIds: record.guessObjectsIds,
        results: record.results,
        createdAt: record.createdAt.toISOString().split('T')[0],
      }),
    );
  },
};
