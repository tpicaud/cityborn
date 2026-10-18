import type { CreateWorldLocation, WorldLocationId } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type WorldLocationContractClient = {
  admin: Pick<ContractClient['admin'], 'worldLocation'>;
};

export interface WorldLocationApi {
  createWorldLocation(
    worldLocation: CreateWorldLocation,
  ): Promise<WorldLocationId>;
}

export function createWorldLocationApi(
  contractClient: WorldLocationContractClient,
): WorldLocationApi {
  return {
    async createWorldLocation(worldLocation) {
      return unwrapApiResponse(
        await contractClient.admin.worldLocation.createWorldLocation({
          body: worldLocation,
        }),
      );
    },
  };
}
