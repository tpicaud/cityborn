'use client';

import {
  type Category,
  type CreateCategory,
  type CreateCategoryInput,
  CreateCategorySchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { BaseSyntheticEvent } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import {
  categoriesQueryOptions,
  invalidateCategories,
  reloadCategories,
} from './api/adminQueries';

type CategoryCreationOptions = {
  onCategoryCreated: (category: Category) => void;
};

export type CategoryCatalog = {
  categories: Category[];
  isLoading: boolean;
  reloadCategories: () => Promise<void>;
};

export type CategoryCreation = {
  form: UseFormReturn<CreateCategoryInput, undefined, CreateCategory>;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
};

const noCategories: Category[] = [];

const categoryCreationDefaultValues: CreateCategoryInput = {
  name: '',
  description: '',
  isPublished: false,
};

export function useCategoryCatalog(): CategoryCatalog {
  const { adminApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const {
    data: categories = noCategories,
    isPending: isLoading,
  }: UseQueryResult<Category[]> = useQuery(categoriesQueryOptions(adminApi));

  return {
    categories,
    isLoading,
    reloadCategories: () => reloadCategories(queryClient),
  };
}

export function useCategoryCreation({
  onCategoryCreated,
}: CategoryCreationOptions): CategoryCreation {
  const { adminApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { invokeError } = useError();
  const form: UseFormReturn<CreateCategoryInput, undefined, CreateCategory> =
    useForm<CreateCategoryInput, undefined, CreateCategory>({
      resolver: zodResolver(CreateCategorySchema),
      defaultValues: categoryCreationDefaultValues,
    });

  return {
    form,
    submit: form.handleSubmit(async (category: CreateCategory) => {
      try {
        const createdCategory: Category =
          await adminApi.createCategory(category);
        await invalidateCategories(queryClient);
        form.reset();
        onCategoryCreated(createdCategory);
      } catch (error: unknown) {
        invokeError(error);
      }
    }),
  };
}
