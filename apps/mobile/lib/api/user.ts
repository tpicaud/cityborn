import type { GameRecord } from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import { client } from './client';

export async function getGameRecords(): Promise<AppResult<GameRecord[]>> {
  const result = await client.user.getGameRecords();
  return toAppResult(result);
}
