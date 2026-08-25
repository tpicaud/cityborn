'use server';

import type { GameRecord } from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<AppResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toAppResult(result);
}
