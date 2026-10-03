import { unwrapApiResponse } from '@cityborn/api';
import { contractClient } from './contractClient';

export async function checkHealth(): Promise<void> {
  unwrapApiResponse(await contractClient.health.check());
}
