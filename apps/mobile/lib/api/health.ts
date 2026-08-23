import { toApiResult } from '@cityborn/api';
import { client } from './client';

export async function checkHealth() {
  const result = await client.health.check();
  return toApiResult(result);
}
