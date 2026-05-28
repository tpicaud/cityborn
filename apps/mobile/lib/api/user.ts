import type { GameRecord } from '@cityborn/api';
import { assertOk, client } from './client';

export async function getGameRecords(): Promise<GameRecord[]> {
  const result = await client.user.getGameRecords();
  assertOk(result);
  return result.body;
}
