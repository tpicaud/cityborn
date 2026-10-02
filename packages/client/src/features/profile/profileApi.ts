import type {
  ApiResult,
  GameRecord,
  UpdateUsername,
  User,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

export interface ProfileApi {
  getGameRecords(): Promise<ApiResult<GameRecord[]>>;
  updateUsername(data: UpdateUsername): Promise<ApiResult<User>>;
}

export function createProfileApi(
  contractClient: Pick<ContractClient, 'user'>,
): ProfileApi {
  return {
    async getGameRecords() {
      return toApiResult(await contractClient.user.getGameRecords());
    },

    async updateUsername(data) {
      return toApiResult(
        await contractClient.user.updateUsername({ body: data }),
      );
    },
  };
}
