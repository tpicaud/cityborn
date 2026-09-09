import type {
  CreateGameRecord,
  GameRecord,
  Player,
  UserId,
} from '@cityborn/api';

export const GAME_RECORD_REPOSITORY = Symbol('GAME_RECORD_REPOSITORY');

export interface GameRecordRepository {
  create(
    createGameRecord: CreateGameRecord,
    users: Pick<Player, 'id'>[],
  ): Promise<Pick<GameRecord, 'id'>>;
  findRecentByUserId(user_id: UserId): Promise<GameRecord[] | null>;
}
