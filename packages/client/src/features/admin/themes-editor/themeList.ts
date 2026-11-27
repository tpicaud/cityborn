import {
  type AdminTheme,
  ApiResponseError,
  ErrorCode,
  type SaveTheme,
  type SaveThemeSchema,
  ThemeMoveDirection,
  UserFacingError,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { invalidatePacks } from '../../../domains/pack/packQueries';
import type { ThemeApi } from '../../../domains/theme/themeApi';
import { updateThemesCache } from '../../../domains/theme/themeQueries';
import type { OrderedListOperations } from '../ordered-list-editor/orderedListMutations';

export type ThemeFormInput = z.input<typeof SaveThemeSchema>;

export function createThemeList({
  themeApi,
  queryClient,
}: {
  themeApi: ThemeApi;
  queryClient: QueryClient;
}): OrderedListOperations<AdminTheme, SaveTheme, SaveTheme> {
  const updateCache: (
    update: (themes: AdminTheme[]) => AdminTheme[],
  ) => Promise<void> = (update) => updateThemesCache({ queryClient, update });
  return {
    create: async (theme) => ({
      ...(await themeApi.createTheme(theme)),
      packCount: 0,
      isDefault: false,
    }),
    update: ({ id, edit }) => themeApi.updateTheme({ id, theme: edit }),
    move: ({ id, direction }) =>
      themeApi.moveTheme({
        id,
        move: { direction: ThemeMoveDirection[direction] },
      }),
    delete: (id) => themeApi.deleteTheme(id),
    updateCache,
    refreshAfterSave: () => invalidatePacks(queryClient),
    describeDeletionFailure: async ({ error, item: theme }) => {
      if (
        !(error instanceof ApiResponseError) ||
        error.code !== ErrorCode.THEME_HAS_PACKS
      )
        return error;
      const refreshedThemes: AdminTheme[] | null = await themeApi
        .getThemes()
        .catch(() => null);
      if (refreshedThemes) await updateCache(() => refreshedThemes);
      const count: number =
        refreshedThemes?.find((item) => item.id === theme.id)?.packCount ??
        theme.packCount;
      return new UserFacingError(
        `Impossible de supprimer « ${theme.name} » : ${count} pack${count > 1 ? 's' : ''} y ${count > 1 ? 'sont encore rattachés' : 'est encore rattaché'}. Change d'abord leur thème.`,
      );
    },
  };
}
