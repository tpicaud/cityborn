'use client';

import type { CategoryTree } from '@cityborn/api';
import { useEffect, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type { CategoryGateway } from '../../ports/gateways';

export interface CategoryTreesState {
  categoryTrees: CategoryTree[];
  isLoading: boolean;
}

export function useCategoryTrees(
  categoryGateway: CategoryGateway,
): CategoryTreesState {
  const { invokeError } = useError();
  const [categoryTrees, setCategoryTrees] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategoryTrees = async () => {
      const result = await categoryGateway.fetchCategoryTrees();
      setIsLoading(false);
      if (!result.ok) return invokeError(result.error);
      setCategoryTrees(result.data);
    };
    loadCategoryTrees();
  }, [categoryGateway, invokeError]);

  return { categoryTrees, isLoading };
}
