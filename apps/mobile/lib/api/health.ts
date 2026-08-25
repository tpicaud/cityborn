import { toAppResult } from '@cityborn/client';
import { client } from './client';

export async function checkHealth() {
  const result = await client.health.check();
  return toAppResult(result);
}
