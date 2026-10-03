'use client';

import type { CategoryTree } from '@cityborn/api';
import { useEffect, useState } from 'react';
import { useError } from '../../shared/errorContext';
import type { CategoryApi } from './categoryApi';

export type CategoryTreesState = {
  categoryTrees: CategoryTree[];
  isLoading: boolean;
};

export function useCategoryTrees(categoryApi: CategoryApi): CategoryTreesState {
  const { invokeError } = useError();
  const [categoryTrees, setCategoryTrees] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted: boolean = true;

    const loadCategoryTrees = async (): Promise<void> => {
      try {
        const loadedCategoryTrees: CategoryTree[] =
          await categoryApi.getCategoryTrees();
        if (!isMounted) return;
        setCategoryTrees(loadedCategoryTrees);
      } catch (error: unknown) {
        if (isMounted) invokeError(error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCategoryTrees();

    return () => {
      isMounted = false;
    };
  }, [categoryApi, invokeError]);

  return { categoryTrees, isLoading };
}
