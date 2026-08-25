'use server';

import { type ApiResult, type GameRecord, toApiResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<ApiResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toApiResult(result);
}
