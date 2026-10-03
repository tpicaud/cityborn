'use client';

import type { Category, CategoryId, FullCategory } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { notFound } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getCategories, getFullCategory } from '@/lib/api/category';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { CategoryBuilder } from './category-builder';

type CategoryLoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'loaded'; category: FullCategory; categories: Category[] };

async function loadCategory(
  categoryId: CategoryId,
): Promise<CategoryLoadState> {
  const [category, categories]: [FullCategory | null, Category[]] =
    await Promise.all([getFullCategory(categoryId), getCategories()]);
  if (!category) return { status: 'missing' };
  return { status: 'loaded', category, categories };
}

export function CategoryBuilderLoader({
  categoryId,
}: {
  categoryId: CategoryId;
}) {
  const { invokeError } = useError();
  const [categoryLoadState, setCategoryLoadState] = useState<CategoryLoadState>(
    { status: 'loading' },
  );

  const reloadCategory = useCallback(async (): Promise<void> => {
    setCategoryLoadState({ status: 'loading' });
    try {
      setCategoryLoadState(await loadCategory(categoryId));
    } catch (error: unknown) {
      setCategoryLoadState({ status: 'failed' });
      invokeError(error);
    }
  }, [categoryId, invokeError]);

  useEffect(() => {
    reloadCategory();
  }, [reloadCategory]);

  if (categoryLoadState.status === 'missing') notFound();

  if (categoryLoadState.status === 'failed') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Button variant="primary" onClick={reloadCategory}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (categoryLoadState.status === 'loading') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <CategoryBuilder
      fetchedCategory={categoryLoadState.category}
      categories={categoryLoadState.categories}
    />
  );
}
