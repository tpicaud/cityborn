import type {
  CreateGameRecord,
  GameRecord,
  Player,
  UserId,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { GameMapper } from '../game.mapper';
import type { GameRecordRepository } from './game-record.repository';

@Injectable()
export class PrismaGameRecordRepository implements GameRecordRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async create(
    createGameRecord: CreateGameRecord,
    users: Pick<Player, 'id'>[],
  ): Promise<Pick<GameRecord, 'id'>> {
    const game_record = await this.txHost.tx.gameRecord.create({
      data: GameMapper.toPrismaCreateInput(createGameRecord, users),
    });

    return { id: game_record.id };
  }

  async findRecentByUserId(user_id: UserId): Promise<GameRecord[] | null> {
    const user = await this.txHost.tx.user.findUnique({
      where: { id: user_id },
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
