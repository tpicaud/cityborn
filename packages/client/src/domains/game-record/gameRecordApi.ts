import type { GameRecord } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

export interface GameRecordApi {
  getGameRecords(): Promise<GameRecord[]>;
}

export function createGameRecordApi(
  contractClient: Pick<ContractClient, 'gameRecord'>,
): GameRecordApi {
  return {
    async getGameRecords() {
      return unwrapApiResponse(
        await contractClient.gameRecord.getGameRecords(),
      );
    },
  };
}
