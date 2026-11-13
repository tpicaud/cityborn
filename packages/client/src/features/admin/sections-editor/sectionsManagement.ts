'use client';
import {
  type AdminTheme,
  type CatalogSection,
  type CatalogSectionId,
  type CatalogSectionMoveDirection,
  type Pack,
  type PackId,
  type RenameCatalogSection,
  RenameCatalogSectionSchema,
  resolveErrorMessage,
  type ThemeId,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type RefObject, useRef, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../../domains/apiProvider';
import {
  removeSectionCache,
  sectionsQueryOptions,
  updateSectionCache,
  updateSectionsCache,
} from '../../../domains/catalog-section/catalogSectionQueries';
import { packsQueryOptions } from '../../../domains/pack/packQueries';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../../shared/errorReporter';
import type { FormSubmitHandler } from '../../../shared/formSubmitHandler';

export type CatalogSectionGroup = {
  themeId: ThemeId | null;
  name: string;
  sections: CatalogSection[];
};
export type SectionsManagement = {
  groups: CatalogSectionGroup[];
  packs: Pack[];
  isBusy: boolean;
  isLoading: boolean;
  loadError: string | null;
  reload: () => void;
  createSection: (data: {
    themeId: ThemeId | null;
    name: string;
  }) => Promise<boolean>;
  renameSection: (data: {
    id: CatalogSectionId;
    name: string;
  }) => Promise<boolean>;
  moveSection: (data: {
    id: CatalogSectionId;
    direction: CatalogSectionMoveDirection;
  }) => Promise<boolean>;
  deleteSection: (id: CatalogSectionId) => Promise<boolean>;
  addPack: (data: { id: CatalogSectionId; packId: PackId }) => Promise<boolean>;
  removePack: (data: {
    id: CatalogSectionId;
    packId: PackId;
  }) => Promise<boolean>;
  movePack: (data: {
    id: CatalogSectionId;
    packId: PackId;
    direction: CatalogSectionMoveDirection;
  }) => Promise<boolean>;
};
export type SectionNameFormOptions = {
  initialName?: string;
  saveName: (name: string) => Promise<boolean>;
  onSaved?: () => void;
};
export type SectionNameForm = {
  form: UseFormReturn<RenameCatalogSection>;
  submit: FormSubmitHandler;
};
export function useSectionNameForm({
  initialName = '',
  saveName,
  onSaved,
}: SectionNameFormOptions): SectionNameForm {
  const form: UseFormReturn<RenameCatalogSection> =
    useForm<RenameCatalogSection>({
      resolver: zodResolver(RenameCatalogSectionSchema),
      defaultValues: { name: initialName },
    });
  return {
    form,
    submit: form.handleSubmit(async ({ name }) => {
      if (await saveName(name)) {
        form.reset({ name: initialName ? name : '' });
        onSaved?.();
      }
    }),
  };
}
const noSections: CatalogSection[] = [];
const noThemes: AdminTheme[] = [];
const noPacks: Pack[] = [];
export function useSectionsManagement(): SectionsManagement {
  const { catalogSectionApi, packApi, themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const query: UseQueryResult<CatalogSection[]> = useQuery(
    sectionsQueryOptions(catalogSectionApi),
  );
  const packsQuery: UseQueryResult<Pack[]> = useQuery({
    ...packsQueryOptions(packApi),
    meta: { reportsError: false },
  });
  const themesQuery: UseQueryResult<AdminTheme[]> = useQuery({
    ...themesQueryOptions(themeApi),
    meta: { reportsError: false },
  });
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const busy: RefObject<boolean> = useRef(false);
  const sections: CatalogSection[] = query.data ?? noSections;
  const groups: CatalogSectionGroup[] = [
    {
      themeId: null,
      name: 'Tous',
      sections: sections.filter((section) => section.themeId === null),
    },
    ...(themesQuery.data ?? noThemes).map(
      (theme): CatalogSectionGroup => ({
        themeId: theme.id,
        name: theme.name,
        sections: sections.filter((section) => section.themeId === theme.id),
      }),
    ),
  ];
  const perform: (write: () => Promise<void>) => Promise<boolean> = async (
    write,
  ) => {
    if (busy.current) return false;
    busy.current = true;
    setIsBusy(true);
    try {
      await write();
      return true;
    } catch (error: unknown) {
      reportError(error);
      return false;
    } finally {
      busy.current = false;
      setIsBusy(false);
    }
  };
  const updateSection: (
    write: () => Promise<CatalogSection>,
  ) => Promise<boolean> = (write) =>
    perform(async () => {
      const section: CatalogSection = await write();
      updateSectionCache({ queryClient, section });
    });
  return {
    groups,
    packs: packsQuery.data ?? noPacks,
    isBusy,
    isLoading: query.isPending || packsQuery.isPending || themesQuery.isPending,
    loadError: query.isError
      ? resolveErrorMessage(query.error)
      : packsQuery.isError
        ? resolveErrorMessage(packsQuery.error)
        : themesQuery.isError
          ? resolveErrorMessage(themesQuery.error)
          : null,
    reload: () => {
      void query.refetch();
      void packsQuery.refetch();
      void themesQuery.refetch();
    },
    createSection: (data) =>
      updateSection(() => catalogSectionApi.createSection(data)),
    renameSection: ({ id, name }) =>
      updateSection(() =>
        catalogSectionApi.renameSection({ id, section: { name } }),
      ),
    moveSection: ({ id, direction }) =>
      perform(async () => {
        const updated: CatalogSection[] = await catalogSectionApi.moveSection({
          id,
          move: { direction },
        });
        updateSectionsCache({ queryClient, sections: updated });
      }),
    deleteSection: (id) =>
      perform(async () => {
        await catalogSectionApi.deleteSection(id);
        removeSectionCache({ queryClient, id });
      }),
    addPack: (params) => updateSection(() => catalogSectionApi.addPack(params)),
    removePack: (params) =>
      updateSection(() => catalogSectionApi.removePack(params)),
    movePack: ({ id, packId, direction }) =>
      updateSection(() =>
        catalogSectionApi.movePack({ id, packId, move: { direction } }),
      ),
  };
}
