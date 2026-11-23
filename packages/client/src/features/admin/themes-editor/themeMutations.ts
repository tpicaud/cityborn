import {
  type AdminTheme,
  ApiResponseError,
  ErrorCode,
  type SaveTheme,
  type SaveThemeSchema,
  type Theme,
  type ThemeId,
  type ThemeMoveDirection,
  UserFacingError,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import { invalidatePacks } from '../../../domains/pack/packQueries';
import type { ThemeApi } from '../../../domains/theme/themeApi';
import {
  invalidateThemes,
  updateThemesCache,
} from '../../../domains/theme/themeQueries';
import type { ReportError } from '../../../shared/errorReporter';
import type { FormSubmitHandler } from '../../../shared/formSubmitHandler';
import type { themeEditorReducer } from './themeEditorState';

export type ThemeMutations = {
  createTheme: FormSubmitHandler;
  updateTheme: FormSubmitHandler;
  moveTheme: (move: {
    theme: AdminTheme;
    direction: ThemeMoveDirection;
  }) => Promise<void>;
  deleteTheme: (theme: AdminTheme) => Promise<void>;
};

export type ThemeFormInput = z.input<typeof SaveThemeSchema>;

type ThemeForm = Pick<
  UseFormReturn<ThemeFormInput, undefined, SaveTheme>,
  'handleSubmit' | 'reset'
>;

export function createThemeMutations({
  themeApi,
  queryClient,
  themes,
  editedThemeId,
  creationForm,
  editForm,
  dispatch,
  reportError,
  setIsMoving,
  setIsDeleting,
}: {
  themeApi: ThemeApi;
  queryClient: QueryClient;
  themes: AdminTheme[];
  editedThemeId: ThemeId | null;
  creationForm: ThemeForm;
  editForm: ThemeForm;
  dispatch: (action: Parameters<typeof themeEditorReducer>[1]) => void;
  reportError: ReportError;
  setIsMoving: (isMoving: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
}): ThemeMutations {
  const refresh: () => Promise<void> = async () => {
    await Promise.all([
      invalidateThemes(queryClient),
      invalidatePacks(queryClient),
    ]);
  };
  return {
    createTheme: creationForm.handleSubmit(async (data: SaveTheme) => {
      try {
        const theme: Theme = await themeApi.createTheme(data);
        updateThemesCache({
          queryClient,
          themes: [...themes, { ...theme, packCount: 0, isDefault: false }],
        });
        creationForm.reset();
        await refresh();
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    updateTheme: editForm.handleSubmit(async (data: SaveTheme) => {
      const id: ThemeId | null = editedThemeId;
      if (!id) return;
      try {
        const theme: Theme = await themeApi.updateTheme({ id, theme: data });
        updateThemesCache({
          queryClient,
          themes: themes.map((item) =>
            item.id === id ? { ...item, ...theme } : item,
          ),
        });
        dispatch({ type: 'saved' });
        await refresh();
      } catch (error: unknown) {
        reportError(error);
      }
    }),
    moveTheme: async ({ theme, direction }) => {
      setIsMoving(true);
      try {
        const movedThemes: AdminTheme[] = await themeApi.moveTheme({
          id: theme.id,
          move: { direction },
        });
        updateThemesCache({ queryClient, themes: movedThemes });
      } catch (error: unknown) {
        reportError(error);
      } finally {
        setIsMoving(false);
      }
    },
    deleteTheme: async (theme) => {
      setIsDeleting(true);
      try {
        await themeApi.deleteTheme(theme.id);
        updateThemesCache({
          queryClient,
          themes: themes.filter((item) => item.id !== theme.id),
        });
        dispatch({ type: 'saved' });
        await refresh();
      } catch (error: unknown) {
        if (
          !(error instanceof ApiResponseError) ||
          error.code !== ErrorCode.THEME_HAS_PACKS
        ) {
          reportError(error);
          return;
        }
        const refreshedThemes: AdminTheme[] = await themeApi
          .getThemes()
          .catch(() => themes);
        updateThemesCache({ queryClient, themes: refreshedThemes });
        const count: number =
          refreshedThemes.find((item) => item.id === theme.id)?.packCount ??
          theme.packCount;
        reportError(
          new UserFacingError(
            `Impossible de supprimer « ${theme.name} » : ${count} pack${count > 1 ? 's' : ''} y ${count > 1 ? 'sont encore rattachés' : 'est encore rattaché'}. Change d'abord leur thème.`,
          ),
        );
      } finally {
        setIsDeleting(false);
      }
    },
  };
}
