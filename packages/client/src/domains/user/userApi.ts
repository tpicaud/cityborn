import type { UpdateUsername, User } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

export interface UserApi {
  updateUsername(data: UpdateUsername): Promise<User>;
}

export function createUserApi(
  contractClient: Pick<ContractClient, 'user'>,
): UserApi {
  return {
    async updateUsername(data) {
      return unwrapApiResponse(
        await contractClient.user.updateUsername({ body: data }),
      );
    },
  };
}
