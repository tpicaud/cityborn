'use server';

import {
  type ApiResult,
  type GameRecord,
  toApiResult,
  type UpdateUsername,
  type User,
} from '@cityborn/api';
import type { ApiClient } from '@cityborn/client/api';
import { getServerClient } from '@/lib/serverClient';

export async function getGameRecords(): Promise<ApiResult<GameRecord[]>> {
  const client = await getServerClient();
  const result = await client.user.getGameRecords();
  return toApiResult(result);
}

export async function updateUsername(
  data: UpdateUsername,
): Promise<ApiResult<User>> {
  const client: ApiClient = await getServerClient();
  return toApiResult(await client.user.updateUsername({ body: data }));
}
