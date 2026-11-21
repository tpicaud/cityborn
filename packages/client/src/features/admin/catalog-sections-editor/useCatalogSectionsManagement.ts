'use client';
import {
  type CatalogSection,
  type CatalogSectionId,
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
  type CatalogSectionFormInput,
  type CatalogSectionMutations,
  createCatalogSectionMutations,
} from './catalogSectionMutations';

type CatalogSectionForm = UseFormReturn<
  CatalogSectionFormInput,
  undefined,
  SaveCatalogSection
>;

export type CatalogSectionsManagement = CatalogSectionMutations & {
  sections: CatalogSection[];
  state: CatalogSectionEditorState;
  creationForm: CatalogSectionForm;
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

export function useCatalogSectionsManagement(): CatalogSectionsManagement {
  const { catalogSectionApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const query: UseQueryResult<CatalogSection[]> = useQuery({
    ...catalogSectionsQueryOptions(catalogSectionApi),
    meta: { reportsError: false },
  });
  const [state, dispatch] = useReducer(
    catalogSectionEditorReducer,
    initialCatalogSectionEditorState,
  );
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const creationForm: CatalogSectionForm = useForm<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >({
    resolver: zodResolver(SaveCatalogSectionSchema),
    defaultValues: { name: '' },
  });
  const editForm: CatalogSectionForm = useForm<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >({
    resolver: zodResolver(SaveCatalogSectionSchema),
    defaultValues: { name: '' },
  });
  const sections: CatalogSection[] = query.data ?? noSections;
  return {
    sections,
    state,
    creationForm,
    editForm,
    isMoving,
    isDeleting,
    isLoading: query.isPending,
    loadError: query.isError ? resolveErrorMessage(query.error) : null,
    reload: () => {
      query.refetch();
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
