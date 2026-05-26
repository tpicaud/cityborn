'use server';

import type { GameRecord } from '@cityborn/api';
import { throwOnError } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<GameRecord[]> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  throwOnError(result);
  return result.body;
}
