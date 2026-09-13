import type { ApiResult, GameRecord } from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import type { ApiClient } from '../../api/createApiClient';

export interface ProfileApi {
  getGameRecords(): Promise<ApiResult<GameRecord[]>>;
}

export function createProfileApi(client: Pick<ApiClient, 'user'>): ProfileApi {
  return {
    async getGameRecords() {
      return toApiResult(await client.user.getGameRecords());
    },
  };
}
