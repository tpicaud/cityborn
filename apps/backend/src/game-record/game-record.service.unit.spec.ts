import type { CreateGameRecord, UserId } from '@cityborn/api';
import {
  buildCreateGameRecord,
  ErrorCode,
  SessionMode,
  UserIdSchema,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { GameRecordService } from './game-record.service';
import type { GameRecordRepository } from './repositories/game-record.repository';

const userId: (value: string) => UserId = (value: string) =>
  UserIdSchema.parse(value);

function buildGameRecordService() {
  const gameRecordRepository: DeepMocked<GameRecordRepository> =
    createMock<GameRecordRepository>();
  const gameRecordService: GameRecordService = new GameRecordService(
    gameRecordRepository,
  );

  return { gameRecordRepository, gameRecordService };
}

describe('GameRecordService.getGameRecords', () => {
  it('rejects an unknown user', async () => {
    const {
      gameRecordRepository,
      gameRecordService,
    }: ReturnType<typeof buildGameRecordService> = buildGameRecordService();
    gameRecordRepository.findRecentByUserId.mockResolvedValue(null);

    await expect(
      gameRecordService.getGameRecords(userId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });
});

describe('GameRecordService.saveSoloGameRecord', () => {
  it('persists a solo record for the user', async () => {
    const {
      gameRecordRepository,
      gameRecordService,
    }: ReturnType<typeof buildGameRecordService> = buildGameRecordService();
    const record: CreateGameRecord = buildCreateGameRecord();

    await gameRecordService.saveSoloGameRecord({
      userId: userId('user-1'),
      createGameRecord: record,
    });

    expect(gameRecordRepository.create).toHaveBeenCalledWith(record, [
      { id: userId('user-1') },
    ]);
  });

  it('rejects a multiplayer record', async () => {
    const {
      gameRecordRepository,
      gameRecordService,
    }: ReturnType<typeof buildGameRecordService> = buildGameRecordService();
    const record: CreateGameRecord = buildCreateGameRecord({
      mode: SessionMode.MULTI,
    });

    await expect(
      gameRecordService.saveSoloGameRecord({
        userId: userId('user-1'),
        createGameRecord: record,
      }),
    ).rejects.toMatchObject({ response: { code: ErrorCode.BAD_REQUEST } });
    expect(gameRecordRepository.create).not.toHaveBeenCalled();
  });
});
