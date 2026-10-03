'use client';

import { CategoryIdSchema } from '@cityborn/api';
import { notFound, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CategoryBuilderLoader } from '@/components/category-builder/category-builder-loader';
import Loader from '@/components/ui/Loader';

function EditedCategory() {
  const categoryId: string | null = useSearchParams().get('id');
  if (!categoryId) notFound();

  return (
    <CategoryBuilderLoader categoryId={CategoryIdSchema.parse(categoryId)} />
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense fallback={<Loader />}>
      <EditedCategory />
    </Suspense>
  );
}
