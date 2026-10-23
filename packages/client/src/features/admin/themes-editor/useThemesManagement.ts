'use client';
import {
  type AdminTheme,
  resolveErrorMessage,
  type SaveTheme,
  SaveThemeSchema,
  type ThemeId,
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
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  initialThemeEditorState,
  type ThemeEditorState,
  themeEditorReducer,
} from './themeEditorState';
import { createThemeMutations, type ThemeMutations } from './themeMutations';
export type ThemesManagement = ThemeMutations & {
  themes: AdminTheme[];
  state: ThemeEditorState;
  creationForm: UseFormReturn<SaveTheme>;
  renameForm: UseFormReturn<SaveTheme>;
  startRenaming: (theme: AdminTheme) => void;
  confirmDeletion: (id: ThemeId) => void;
  cancel: () => void;
  isDeleting: boolean;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
};
const noThemes: AdminTheme[] = [];
export function useThemesManagement(): ThemesManagement {
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
    ...createThemeMutations({
      themeApi,
      queryClient,
      themes,
      editedThemeId: state.editedThemeId,
      creationForm,
      renameForm,
      dispatch,
      setIsDeleting,
    }),
  };
}
