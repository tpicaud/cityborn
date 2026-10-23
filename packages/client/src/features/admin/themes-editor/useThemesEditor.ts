'use client';
import {
  type AdminTheme,
  ApiResponseError,
  ErrorCode,
  resolveErrorMessage,
  type SaveTheme,
  SaveThemeSchema,
  type Theme,
  type ThemeId,
  UserFacingError,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useReducer, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../../domains/apiProvider';
import { invalidatePacks } from '../../../domains/pack/packQueries';
import {
  invalidateThemes,
  themesQueryOptions,
  updateThemesCache,
} from '../../../domains/theme/themeQueries';
import type { FormSubmitHandler } from '../../../shared/formSubmitHandler';
import {
  initialThemeEditorState,
  type ThemeEditorState,
  themeEditorReducer,
} from './themeEditorState';
export type ThemesEditor = {
  themes: AdminTheme[];
  state: ThemeEditorState;
  creationForm: UseFormReturn<SaveTheme>;
  renameForm: UseFormReturn<SaveTheme>;
  createTheme: FormSubmitHandler;
  renameTheme: FormSubmitHandler;
  startRenaming: (theme: AdminTheme) => void;
  confirmDeletion: (id: ThemeId) => void;
  cancel: () => void;
  deleteTheme: (theme: AdminTheme) => Promise<void>;
  isDeleting: boolean;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
};
const noThemes: AdminTheme[] = [];
export function useThemesEditor(): ThemesEditor {
  const { themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const query: UseQueryResult<AdminTheme[]> = useQuery({
    ...themesQueryOptions(themeApi),
    meta: { reportsError: false },
  });
  const [state, dispatch] = useReducer(
    themeEditorReducer,
    initialThemeEditorState,
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const creationForm: UseFormReturn<SaveTheme> = useForm<SaveTheme>({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  const renameForm: UseFormReturn<SaveTheme> = useForm<SaveTheme>({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  const themes: AdminTheme[] = query.data ?? noThemes;
  const refresh: () => Promise<void> = async () => {
    await Promise.all([
      invalidateThemes(queryClient),
      invalidatePacks(queryClient),
    ]);
  };
  return {
    themes,
    state,
    creationForm,
    renameForm,
    isDeleting,
    isLoading: query.isPending,
    loadError: query.isError ? resolveErrorMessage(query.error) : null,
    reload: () => {
      query.refetch();
    },
    startRenaming: (theme) => {
      renameForm.reset({ name: theme.name });
      dispatch({ type: 'edit', id: theme.id });
    },
    confirmDeletion: (id) => dispatch({ type: 'confirmDeletion', id }),
    cancel: () => dispatch({ type: 'cancel' }),
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
    renameTheme: renameForm.handleSubmit(async (data: SaveTheme) => {
      const id: ThemeId | null = state.editedThemeId;
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
