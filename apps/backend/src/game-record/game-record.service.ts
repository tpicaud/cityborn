import type { CreateGameRecord, GameRecord, UserId } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import {
  GAME_RECORD_REPOSITORY,
  type GameRecordRepository,
} from './repositories/game-record.repository';

@Injectable()
export class GameRecordService {
  constructor(
    @Inject(GAME_RECORD_REPOSITORY)
    private readonly gameRecordRepository: GameRecordRepository,
  ) {}

  async create(
    createGameRecord: CreateGameRecord,
    users: { id: UserId }[],
  ): Promise<Pick<GameRecord, 'id'>> {
    return this.gameRecordRepository.create(createGameRecord, users);
  }

  async findRecentByUserId(userId: UserId): Promise<GameRecord[] | null> {
    return this.gameRecordRepository.findRecentByUserId(userId);
  }
}
