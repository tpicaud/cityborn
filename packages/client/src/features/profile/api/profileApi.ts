import type { GameRecord, UpdateUsername, User } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../../api/contractClient';

export interface ProfileApi {
  getGameRecords(): Promise<GameRecord[]>;
  updateUsername(data: UpdateUsername): Promise<User>;
}

export function createProfileApi(
  contractClient: Pick<ContractClient, 'user'>,
): ProfileApi {
  return {
    async getGameRecords() {
      return unwrapApiResponse(await contractClient.user.getGameRecords());
    },

    async updateUsername(data) {
      return unwrapApiResponse(
        await contractClient.user.updateUsername({ body: data }),
      );
    },
  };
}
