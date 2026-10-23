import type { Theme } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type ThemeContractClient = {
  admin: Pick<ContractClient['admin'], 'theme'>;
};

export interface ThemeApi {
  getThemes(): Promise<Theme[]>;
}

export function createThemeApi(contractClient: ThemeContractClient): ThemeApi {
  return {
    async getThemes() {
      return unwrapApiResponse(await contractClient.admin.theme.getThemes({}));
    },
  };
}
