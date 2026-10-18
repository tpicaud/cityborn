import type {
  AppContract,
  CreateGuessObject,
  FullGuessObject,
  GuessObject,
  GuessObjectId,
  PatchGuessObject,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../api/contractClient';

type GuessObjectContractClient = {
  admin: Pick<ContractClient['admin'], 'guessObjects'>;
};

type GuessObjectUpdate = {
  guessObjectId: GuessObjectId;
  guessObject: PatchGuessObject;
};

export interface GuessObjectApi {
  getGuessObject(guessObjectId: GuessObjectId): Promise<GuessObject | null>;
  getFullGuessObject(
    guessObjectId: GuessObjectId,
  ): Promise<FullGuessObject | null>;
  createGuessObject(guessObject: CreateGuessObject): Promise<GuessObjectId>;
  updateGuessObject(
    guessObjectUpdate: GuessObjectUpdate,
  ): Promise<GuessObjectId>;
}

export function createGuessObjectApi(
  contractClient: GuessObjectContractClient,
): GuessObjectApi {
  return {
    async getGuessObject(guessObjectId) {
      const result: ClientInferResponses<
        AppContract['admin']['guessObjects']['getGuessObject']
      > = await contractClient.admin.guessObjects.getGuessObject({
        params: { id: guessObjectId },
        query: { include: 'world_location_preview' },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async getFullGuessObject(guessObjectId) {
      const result: ClientInferResponses<
        AppContract['admin']['guessObjects']['getFullGuessObject']
      > = await contractClient.admin.guessObjects.getFullGuessObject({
        params: { id: guessObjectId },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async createGuessObject(guessObject) {
      return unwrapApiResponse(
        await contractClient.admin.guessObjects.createGuessObject({
          body: guessObject,
        }),
      );
    },

    async updateGuessObject({ guessObjectId, guessObject }) {
      return unwrapApiResponse(
        await contractClient.admin.guessObjects.updateGuessObject({
          params: { id: guessObjectId },
          body: guessObject,
        }),
      );
    },
  };
}
