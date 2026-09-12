import type { CreateGameRecord, GameRecord, UserId } from '@cityborn/api';

export const GAME_RECORD_REPOSITORY = Symbol('GAME_RECORD_REPOSITORY');

export interface GameRecordRepository {
  create(
    createGameRecord: CreateGameRecord,
    users: { id: UserId }[],
  ): Promise<Pick<GameRecord, 'id'>>;
  findRecentByUserId(userId: UserId): Promise<GameRecord[] | null>;
}
