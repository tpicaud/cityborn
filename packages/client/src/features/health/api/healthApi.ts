import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../../api/contractClient';

export interface HealthApi {
  checkHealth(): Promise<void>;
}

export function createHealthApi(
  contractClient: Pick<ContractClient, 'health'>,
): HealthApi {
  return {
    async checkHealth() {
      unwrapApiResponse(await contractClient.health.check());
    },
  };
}
