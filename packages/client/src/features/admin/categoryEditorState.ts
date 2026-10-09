import type { Category, FullCategory } from '@cityborn/api';
import type { QueryObserverResult } from '@tanstack/react-query';

export type CategoryEditorState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'loaded'; category: FullCategory; categories: Category[] };

type CategoryEditorQueries = {
  fullCategoryQuery: QueryObserverResult<FullCategory | null>;
  categoriesQuery: QueryObserverResult<Category[]>;
};

function hasFailedWithoutData(query: QueryObserverResult<unknown>): boolean {
  return query.data === undefined && query.isError;
}

export function toCategoryEditorState({
  fullCategoryQuery,
  categoriesQuery,
}: CategoryEditorQueries): CategoryEditorState {
  if (
    hasFailedWithoutData(fullCategoryQuery) ||
    hasFailedWithoutData(categoriesQuery)
  ) {
    return { status: 'failed' };
  }
  if (fullCategoryQuery.data === null) return { status: 'missing' };
  if (
    fullCategoryQuery.data === undefined ||
    categoriesQuery.data === undefined
  ) {
    return { status: 'loading' };
  }
  return {
    status: 'loaded',
    category: fullCategoryQuery.data,
    categories: categoriesQuery.data,
  };
}
