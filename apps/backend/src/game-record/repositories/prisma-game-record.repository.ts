import type { CreateGameRecord, GameRecord, UserId } from '@cityborn/api';
import { GameRecordIdSchema } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { GameMapper } from '../mappers/game.mapper';
import type { GameRecordRepository } from './game-record.repository';

@Injectable()
export class PrismaGameRecordRepository implements GameRecordRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async create(
    createGameRecord: CreateGameRecord,
    users: { id: UserId }[],
  ): Promise<Pick<GameRecord, 'id'>> {
    const gameRecord = await this.txHost.tx.gameRecord.create({
      data: {
        mode: createGameRecord.mode,
        gameConfig: createGameRecord.gameConfig,
        players: createGameRecord.players,
        guessObjectsIds: createGameRecord.guessObjectsIds,
        results: createGameRecord.results,
        users: { connect: users.map((user) => ({ id: user.id })) },
      },
    });

    return { id: GameRecordIdSchema.parse(gameRecord.id) };
  }

  async findRecentByUserId(userId: UserId): Promise<GameRecord[] | null> {
    const user = await this.txHost.tx.user.findUnique({
      where: { id: userId },
      include: {
        gameRecords: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    return GameMapper.toGameRecord(user.gameRecords);
  }
}
