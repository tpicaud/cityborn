'use client';
import {
  type AdminTheme,
  type SaveTheme,
  SaveThemeSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../../domains/apiProvider';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  type OrderedListEditor,
  useOrderedListEditor,
} from '../ordered-list-editor/useOrderedListEditor';
import { createThemeList, type ThemeFormInput } from './themeList';

type ThemeForm = UseFormReturn<ThemeFormInput, undefined, SaveTheme>;

export type ThemesManagement = OrderedListEditor<
  AdminTheme,
  ThemeForm,
  ThemeForm
> & {
  themes: AdminTheme[];
  isLoading: boolean;
  hasLoadError: boolean;
  reload: () => void;
};

const noThemes: AdminTheme[] = [];

export function useThemesManagement(): ThemesManagement {
  const { themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const query: UseQueryResult<AdminTheme[]> = useQuery(
    themesQueryOptions(themeApi),
  );
  const creationForm: ThemeForm = useForm<ThemeFormInput, undefined, SaveTheme>(
    {
      resolver: zodResolver(SaveThemeSchema),
      defaultValues: { name: '' },
    },
  );
  const editForm: ThemeForm = useForm<ThemeFormInput, undefined, SaveTheme>({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  const editor: OrderedListEditor<AdminTheme, ThemeForm, ThemeForm> =
    useOrderedListEditor({
      list: createThemeList({ themeApi, queryClient }),
      creationForm,
      editForm,
      toEditValues: (theme) => ({ name: theme.name, icon: theme.icon.name }),
    });
  return {
    ...editor,
    themes: query.data ?? noThemes,
    isLoading: query.isPending,
    hasLoadError: query.isLoadingError,
    reload: () => {
      query.refetch();
    },
  };
}
