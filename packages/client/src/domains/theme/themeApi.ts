import type { AdminTheme, SaveTheme, Theme, ThemeId } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type ThemeContractClient = { admin: Pick<ContractClient['admin'], 'theme'> };
export interface ThemeApi {
  getThemes(): Promise<AdminTheme[]>;
  createTheme(theme: SaveTheme): Promise<Theme>;
  updateTheme(data: { id: ThemeId; theme: SaveTheme }): Promise<Theme>;
  deleteTheme(id: ThemeId): Promise<void>;
}
export function createThemeApi(contractClient: ThemeContractClient): ThemeApi {
  return {
    async getThemes() {
      return unwrapApiResponse(await contractClient.admin.theme.getThemes({}));
    },
    async createTheme(theme) {
      return unwrapApiResponse(
        await contractClient.admin.theme.createTheme({ body: theme }),
      );
    },
    async updateTheme({ id, theme }) {
      return unwrapApiResponse(
        await contractClient.admin.theme.updateTheme({
          params: { id },
          body: theme,
        }),
      );
    },
    async deleteTheme(id) {
      unwrapApiResponse(
        await contractClient.admin.theme.deleteTheme({
          params: { id },
          body: {},
        }),
      );
    },
  };
}
