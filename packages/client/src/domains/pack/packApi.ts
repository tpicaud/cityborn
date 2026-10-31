import type {
  AppContract,
  CreatePack,
  FullPack,
  Pack,
  PackId,
  UpdatePack,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../api/contractClient';

type PackContractClient = Pick<ContractClient, 'pack'> & {
  admin: Pick<ContractClient['admin'], 'pack'>;
};

type PackUpdate = {
  packId: PackId;
  pack: UpdatePack;
};

export interface PackApi {
  getPublishedPacks(): Promise<Pack[]>;
  getPacks(): Promise<Pack[]>;
  getFullPack(packId: PackId): Promise<FullPack | null>;
  createPack(pack: CreatePack): Promise<Pack>;
  updatePack(packUpdate: PackUpdate): Promise<Pack>;
  deletePack(packId: PackId): Promise<void>;
}

export function createPackApi(contractClient: PackContractClient): PackApi {
  return {
    async getPublishedPacks() {
      return unwrapApiResponse(await contractClient.pack.getPacks({}));
    },

    async getPacks() {
      return unwrapApiResponse(
        await contractClient.admin.pack.getAllPacks({
          query: { include: 'guessObjects' },
        }),
      );
    },

    async getFullPack(packId) {
      const result: ClientInferResponses<
        AppContract['admin']['pack']['getFullPack']
      > = await contractClient.admin.pack.getFullPack({
        params: { id: packId },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async createPack(pack) {
      return unwrapApiResponse(
        await contractClient.admin.pack.createPack({ body: pack }),
      );
    },

    async updatePack({ packId, pack }) {
      return unwrapApiResponse(
        await contractClient.admin.pack.updatePack({
          params: { id: packId },
          body: pack,
        }),
      );
    },

    async deletePack(packId) {
      unwrapApiResponse(
        await contractClient.admin.pack.deletePack({
          params: { id: packId },
          body: {},
        }),
      );
    },
  };
}
