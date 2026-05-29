'use server';

import type { GameRecord } from '@cityborn/api';
import { type ActionResult, toActionResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<ActionResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toActionResult(result);
}
