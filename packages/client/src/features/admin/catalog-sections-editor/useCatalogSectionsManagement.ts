'use client';
import {
  type AdminTheme,
  type CatalogSection,
  type CatalogSectionId,
  type CreateCatalogSection,
  resolveErrorMessage,
  type SaveCatalogSection,
  SaveCatalogSectionSchema,
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
import { catalogSectionsQueryOptions } from '../../../domains/catalog-section/catalogSectionQueries';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../../shared/errorReporter';
import {
  type CatalogSectionEditorState,
  catalogSectionEditorReducer,
  initialCatalogSectionEditorState,
} from './catalogSectionEditorState';
import {
  type CatalogSectionGroup,
  createCatalogSectionGroups,
} from './catalogSectionGroups';
import {
  allPacksFilterValue,
  type CatalogSectionCreationFormInput,
  CatalogSectionCreationFormSchema,
  type CatalogSectionFormInput,
  type CatalogSectionMutations,
  createCatalogSectionMutations,
} from './catalogSectionMutations';

type CatalogSectionForm = UseFormReturn<
  CatalogSectionFormInput,
  undefined,
  SaveCatalogSection
>;

type CatalogSectionCreationForm = UseFormReturn<
  CatalogSectionCreationFormInput,
  undefined,
  CreateCatalogSection
>;

export type CatalogSectionsManagement = CatalogSectionMutations & {
  sectionGroups: CatalogSectionGroup[];
  themes: AdminTheme[];
  state: CatalogSectionEditorState;
  creationForm: CatalogSectionCreationForm;
  editForm: CatalogSectionForm;
  startEditing: (section: CatalogSection) => void;
  confirmDeletion: (id: CatalogSectionId) => void;
  cancel: () => void;
  isMoving: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
};

const noSections: CatalogSection[] = [];
const noThemes: AdminTheme[] = [];

export function useCatalogSectionsManagement(): CatalogSectionsManagement {
  const { catalogSectionApi, themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const query: UseQueryResult<CatalogSection[]> = useQuery({
    ...catalogSectionsQueryOptions(catalogSectionApi),
    meta: { reportsError: false },
  });
  const themesQuery: UseQueryResult<AdminTheme[]> = useQuery({
    ...themesQueryOptions(themeApi),
    meta: { reportsError: false },
  });
  const [state, dispatch] = useReducer(
    catalogSectionEditorReducer,
    initialCatalogSectionEditorState,
  );
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const creationForm: CatalogSectionCreationForm = useForm<
    CatalogSectionCreationFormInput,
    undefined,
    CreateCatalogSection
  >({
    resolver: zodResolver(CatalogSectionCreationFormSchema),
    defaultValues: { name: '', themeId: allPacksFilterValue },
  });
  const editForm: CatalogSectionForm = useForm<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >({
    resolver: zodResolver(SaveCatalogSectionSchema),
    defaultValues: { name: '' },
  });
  const themes: AdminTheme[] = themesQuery.data ?? noThemes;
  const loadError: Error | null = query.error ?? themesQuery.error;
  return {
    sectionGroups: createCatalogSectionGroups({
      sections: query.data ?? noSections,
      themes,
    }),
    themes,
    state,
    creationForm,
    editForm,
    isMoving,
    isDeleting,
    isLoading: query.isPending || themesQuery.isPending,
    loadError: loadError ? resolveErrorMessage(loadError) : null,
    reload: () => {
      if (query.isError) query.refetch();
      if (themesQuery.isError) themesQuery.refetch();
    },
    startEditing: (section) => {
      editForm.reset({ name: section.name });
      dispatch({ type: 'edit', id: section.id });
    },
    confirmDeletion: (id) => dispatch({ type: 'confirmDeletion', id }),
    cancel: () => dispatch({ type: 'cancel' }),
    ...createCatalogSectionMutations({
      catalogSectionApi,
      queryClient,
      editedSectionId: state.editedSectionId,
      creationForm,
      editForm,
      dispatch,
      reportError,
      setIsMoving,
      setIsDeleting,
    }),
  };
}
