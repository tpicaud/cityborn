'use server';

import type { GameRecord } from '@cityborn/api';
import { type ApiResult, toApiResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<ApiResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toApiResult(result);
}
