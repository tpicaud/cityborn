import {
  type AdminTheme,
  ApiResponseError,
  ErrorCode,
  resolveErrorMessage,
  type SaveTheme,
  type Theme,
  type ThemeId,
  type ThemeMoveDirection,
  UserFacingError,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import { invalidatePacks } from '../../../domains/pack/packQueries';
import type { ThemeApi } from '../../../domains/theme/themeApi';
import {
  invalidateThemes,
  updateThemesCache,
} from '../../../domains/theme/themeQueries';
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

type ThemeForm = Pick<UseFormReturn<SaveTheme>, 'handleSubmit' | 'reset'>;

export function createThemeMutations({
  themeApi,
  queryClient,
  themes,
  editedThemeId,
  creationForm,
  editionForm,
  dispatch,
  setIsMoving,
  setIsDeleting,
}: {
  themeApi: ThemeApi;
  queryClient: QueryClient;
  themes: AdminTheme[];
  editedThemeId: ThemeId | null;
  creationForm: ThemeForm;
  editionForm: ThemeForm;
  dispatch: (action: Parameters<typeof themeEditorReducer>[1]) => void;
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
      dispatch({ type: 'creationError', message: null });
      try {
        const theme: Theme = await themeApi.createTheme(data);
        updateThemesCache({
          queryClient,
          themes: [...themes, { ...theme, packCount: 0, isDefault: false }],
        });
        creationForm.reset();
        await refresh();
      } catch (error: unknown) {
        dispatch({
          type: 'creationError',
          message: resolveErrorMessage(error),
        });
      }
    }),
    updateTheme: editionForm.handleSubmit(async (data: SaveTheme) => {
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
        dispatch({ type: 'saved', id });
        await refresh();
      } catch (error: unknown) {
        dispatch({ type: 'rowError', id, message: resolveErrorMessage(error) });
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
        dispatch({ type: 'moved', id: theme.id });
      } catch (error: unknown) {
        dispatch({
          type: 'rowError',
          id: theme.id,
          message: resolveErrorMessage(error),
        });
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
        dispatch({ type: 'saved', id: theme.id });
        await refresh();
      } catch (error: unknown) {
        let message: string = resolveErrorMessage(error);
        if (
          error instanceof ApiResponseError &&
          error.code === ErrorCode.THEME_HAS_PACKS
        ) {
          let count: number = theme.packCount;
          const refreshedThemes: AdminTheme[] = await themeApi
            .getThemes()
            .catch(() => themes);
          updateThemesCache({ queryClient, themes: refreshedThemes });
          count =
            refreshedThemes.find((item) => item.id === theme.id)?.packCount ??
            count;
          message = resolveErrorMessage(
            new UserFacingError(
              `Impossible de supprimer « ${theme.name} » : ${count} pack${count > 1 ? 's' : ''} y ${count > 1 ? 'sont encore rattachés' : 'est encore rattaché'}. Change d'abord leur thème.`,
            ),
          );
        }
        dispatch({ type: 'rowError', id: theme.id, message });
      } finally {
        setIsDeleting(false);
      }
    },
  };
}
