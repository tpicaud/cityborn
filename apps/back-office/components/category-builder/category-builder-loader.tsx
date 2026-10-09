'use client';

import type { CategoryId } from '@cityborn/api';
import {
  type CategoryEditorLoad,
  useCategoryEditorLoad,
} from '@cityborn/client/admin';
import { notFound } from 'next/navigation';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { CategoryBuilder } from './category-builder';

export function CategoryBuilderLoader({
  categoryId,
}: {
  categoryId: CategoryId;
}) {
  const { categoryEditorState, retry }: CategoryEditorLoad =
    useCategoryEditorLoad({ categoryId });

  if (categoryEditorState.status === 'missing') notFound();

  if (categoryEditorState.status === 'failed') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Button variant="primary" onClick={retry}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (categoryEditorState.status === 'loading') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <CategoryBuilder
      key={categoryEditorState.category.id}
      editedCategory={categoryEditorState.category}
      categories={categoryEditorState.categories}
    />
  );
}
