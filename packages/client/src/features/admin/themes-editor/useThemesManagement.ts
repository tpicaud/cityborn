'use client';
import {
  type AdminTheme,
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
  type ErrorReporter,
  useErrorReporter,
} from '../../../shared/errorReporter';
import {
  initialThemeEditorState,
  type ThemeEditorState,
  themeEditorReducer,
} from './themeEditorState';
import {
  createThemeMutations,
  type ThemeFormInput,
  type ThemeMutations,
} from './themeMutations';
export type ThemesManagement = ThemeMutations & {
  themes: AdminTheme[];
  state: ThemeEditorState;
  creationForm: UseFormReturn<ThemeFormInput, undefined, SaveTheme>;
  editForm: UseFormReturn<ThemeFormInput, undefined, SaveTheme>;
  startEditing: (theme: AdminTheme) => void;
  confirmDeletion: (id: ThemeId) => void;
  cancel: () => void;
  isMoving: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  hasLoadError: boolean;
  reload: () => void;
};
const noThemes: AdminTheme[] = [];
export function useThemesManagement(): ThemesManagement {
  const { themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const query: UseQueryResult<AdminTheme[]> = useQuery(
    themesQueryOptions(themeApi),
  );
  const [state, dispatch] = useReducer(
    themeEditorReducer,
    initialThemeEditorState,
  );
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const creationForm: UseFormReturn<ThemeFormInput, undefined, SaveTheme> =
    useForm<ThemeFormInput, undefined, SaveTheme>({
      resolver: zodResolver(SaveThemeSchema),
      defaultValues: { name: '' },
    });
  const editForm: UseFormReturn<ThemeFormInput, undefined, SaveTheme> = useForm<
    ThemeFormInput,
    undefined,
    SaveTheme
  >({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  const themes: AdminTheme[] = query.data ?? noThemes;
  return {
    themes,
    state,
    creationForm,
    editForm,
    isMoving,
    isDeleting,
    isLoading: query.isPending,
    hasLoadError: query.isLoadingError,
    reload: () => {
      query.refetch();
    },
    startEditing: (theme) => {
      editForm.reset({ name: theme.name, icon: theme.icon.name });
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
      editForm,
      dispatch,
      reportError,
      setIsMoving,
      setIsDeleting,
    }),
  };
}
