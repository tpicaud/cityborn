'use client';
import {
  type AdminTheme,
  type CatalogSection,
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
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../../domains/apiProvider';
import { catalogSectionsQueryOptions } from '../../../domains/catalog-section/catalogSectionQueries';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  type OrderedListEditor,
  useOrderedListEditor,
} from '../ordered-list-editor/useOrderedListEditor';
import {
  allPacksFilterValue,
  type CatalogSectionGroup,
  createCatalogSectionGroups,
} from './catalogSectionGroups';
import {
  type CatalogSectionCreationFormInput,
  CatalogSectionCreationFormSchema,
  type CatalogSectionFormInput,
  createCatalogSectionList,
  createNextCatalogSectionCreationValues,
} from './catalogSectionList';

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

export type CatalogSectionsManagement = OrderedListEditor<
  CatalogSection,
  CatalogSectionCreationForm,
  CatalogSectionForm
> & {
  sectionGroups: CatalogSectionGroup[];
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
};

const noSections: CatalogSection[] = [];
const noThemes: AdminTheme[] = [];

export function useCatalogSectionsManagement(): CatalogSectionsManagement {
  const { catalogSectionApi, themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const query: UseQueryResult<CatalogSection[]> = useQuery({
    ...catalogSectionsQueryOptions(catalogSectionApi),
    meta: { reportsError: false },
  });
  const themesQuery: UseQueryResult<AdminTheme[]> = useQuery({
    ...themesQueryOptions(themeApi),
    meta: { reportsError: false },
  });
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
  const editor: OrderedListEditor<
    CatalogSection,
    CatalogSectionCreationForm,
    CatalogSectionForm
  > = useOrderedListEditor({
    list: createCatalogSectionList({ catalogSectionApi, queryClient }),
    creationForm,
    editForm,
    toEditValues: (section) => ({ name: section.name }),
    nextCreationValues: createNextCatalogSectionCreationValues,
  });
  const loadError: Error | null = query.error ?? themesQuery.error;
  return {
    ...editor,
    sectionGroups: createCatalogSectionGroups({
      sections: query.data ?? noSections,
      themes: themesQuery.data ?? noThemes,
    }),
    isLoading: query.isPending || themesQuery.isPending,
    loadError: loadError ? resolveErrorMessage(loadError) : null,
    reload: () => {
      if (query.isError) query.refetch();
      if (themesQuery.isError) themesQuery.refetch();
    },
  };
}
