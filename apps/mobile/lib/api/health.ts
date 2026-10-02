import { toApiResult } from '@cityborn/api';
import { contractClient } from './contractClient';

export async function checkHealth() {
  const result = await contractClient.health.check();
  return toApiResult(result);
}
