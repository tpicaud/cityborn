import type {
  AdminTheme,
  MoveTheme,
  SaveTheme,
  Theme,
  ThemeId,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ContractClient } from '../../api/contractClient';

type ThemeContractClient = Pick<ContractClient, 'theme'> & {
  admin: Pick<ContractClient['admin'], 'theme'>;
};
export interface ThemeApi {
  getPlayableThemes(): Promise<Theme[]>;
  getThemes(): Promise<AdminTheme[]>;
  createTheme(theme: SaveTheme): Promise<Theme>;
  updateTheme(data: { id: ThemeId; theme: SaveTheme }): Promise<Theme>;
  moveTheme(data: { id: ThemeId; move: MoveTheme }): Promise<AdminTheme[]>;
  deleteTheme(id: ThemeId): Promise<void>;
}
export function createThemeApi(contractClient: ThemeContractClient): ThemeApi {
  return {
    async getPlayableThemes() {
      return unwrapApiResponse(
        await contractClient.theme.getPlayableThemes({}),
      );
    },
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
    async moveTheme({ id, move }) {
      return unwrapApiResponse(
        await contractClient.admin.theme.moveTheme({
          params: { id },
          body: move,
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
