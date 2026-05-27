'use server';

import type { GameRecord } from '@cityborn/api';
import { type ActionResult, toActionResult } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<ActionResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toActionResult(result);
}
