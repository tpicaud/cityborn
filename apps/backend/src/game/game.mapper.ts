import {
  type CreateGameRecord,
  type GameRecord,
  GameRecordSchema,
  type Player,
} from '@cityborn/api';
import type { Prisma, GameRecord as PrismaGameRecord } from '@prisma/client';
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

  toPrismaCreateInput(
    createGameRecord: CreateGameRecord,
    users: Pick<Player, 'id'>[],
  ): Prisma.GameRecordCreateInput {
    return {
      mode: createGameRecord.mode,
      gameConfig: createGameRecord.gameConfig,
      players: createGameRecord.players,
      guessObjectsIds: createGameRecord.guessObjectsIds,
      results: createGameRecord.results,
      users: { connect: users.map((user) => ({ id: user.id })) },
    };
  },
};
