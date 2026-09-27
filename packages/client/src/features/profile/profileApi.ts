import type {
  ApiResult,
  GameRecord,
  UpdateUsername,
  User,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import type { ApiClient } from '../../api/createApiClient';

export interface ProfileApi {
  getGameRecords(): Promise<ApiResult<GameRecord[]>>;
  updateUsername(data: UpdateUsername): Promise<ApiResult<User>>;
}

export function createProfileApi(client: Pick<ApiClient, 'user'>): ProfileApi {
  return {
    async getGameRecords() {
      return toApiResult(await client.user.getGameRecords());
    },

    async updateUsername(data) {
      return toApiResult(await client.user.updateUsername({ body: data }));
    },
  };
}
