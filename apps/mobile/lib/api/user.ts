import type { GameRecord } from '@cityborn/api';
import { throwOnError } from '@cityborn/api';
import { client } from './client';

export async function getGameRecords(): Promise<GameRecord[]> {
  const result = await client.user.getGameRecords();
  throwOnError(result);
  return result.body;
}
