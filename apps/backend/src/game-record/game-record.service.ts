import {
  type CreateGameRecord,
  ErrorCode,
  type GameRecord,
  SessionMode,
  type UserId,
} from '@cityborn/api';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

  async getGameRecords(userId: UserId): Promise<GameRecord[]> {
    const gameRecords: GameRecord[] | null =
      await this.gameRecordRepository.findRecentByUserId(userId);

    if (!gameRecords)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: `Invalid credentials`,
      });

    return gameRecords;
  }

  async saveSoloGameRecord({
    userId,
    createGameRecord,
  }: {
    userId: UserId;
    createGameRecord: CreateGameRecord;
  }): Promise<void> {
    if (createGameRecord.mode !== SessionMode.SOLO) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot save game with this gameMode',
      });
    }

    await this.gameRecordRepository.create(createGameRecord, [{ id: userId }]);
  }
}
