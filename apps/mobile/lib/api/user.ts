import { type ApiResult, type GameRecord, toApiResult } from '@cityborn/api';
import { client } from './client';

export async function getGameRecords(): Promise<ApiResult<GameRecord[]>> {
  const result = await client.user.getGameRecords();
  return toApiResult(result);
}
