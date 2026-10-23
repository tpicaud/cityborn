'use client';

import {
  type CreatePack,
  type CreatePackInput,
  CreatePackSchema,
  type Pack,
  type Theme,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  invalidatePacks,
  packsQueryOptions,
  reloadPacks,
} from '../../domains/pack/packQueries';
import { themesQueryOptions } from '../../domains/theme/themeQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { FormSubmitHandler } from '../../shared/formSubmitHandler';

export type PackCreationOptions = {
  onPackCreated: (pack: Pack) => void;
};

export type PackCatalog = {
  packs: Pack[];
  themes: Theme[];
  isLoading: boolean;
  reloadPacks: () => Promise<void>;
};

export type PackCreation = {
  form: UseFormReturn<CreatePackInput, undefined, CreatePack>;
  submit: FormSubmitHandler;
};

const noPacks: Pack[] = [];

const noThemes: Theme[] = [];

const packCreationDefaultValues: CreatePackInput = {
  name: '',
  description: '',
  isPublished: false,
};

export function usePackCatalog(): PackCatalog {
  const { packApi, themeApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const {
    data: packs = noPacks,
    isPending: isLoading,
  }: UseQueryResult<Pack[]> = useQuery(packsQueryOptions(packApi));
  const { data: themes = noThemes }: UseQueryResult<Theme[]> = useQuery(
    themesQueryOptions(themeApi),
  );

  return {
    packs,
    themes,
    isLoading,
    reloadPacks: () => reloadPacks(queryClient),
  };
}

export function usePackCreation({
  onPackCreated,
}: PackCreationOptions): PackCreation {
  const { packApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const form: UseFormReturn<CreatePackInput, undefined, CreatePack> = useForm<
    CreatePackInput,
    undefined,
    CreatePack
  >({
    resolver: zodResolver(CreatePackSchema),
    defaultValues: packCreationDefaultValues,
  });

  return {
    form,
    submit: form.handleSubmit(async (pack: CreatePack) => {
      try {
        const createdPack: Pack = await packApi.createPack(pack);
        await invalidatePacks(queryClient);
        form.reset();
        onPackCreated(createdPack);
      } catch (error: unknown) {
        reportError(error);
      }
    }),
  };
}
