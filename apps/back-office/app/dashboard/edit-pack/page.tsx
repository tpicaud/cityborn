'use client';

import { PackIdSchema } from '@cityborn/api';
import { notFound, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loader from '@/components/ui/Loader';
import { PackBuilderLoader } from '@/features/admin/pack-builder/pack-builder-loader';

function EditedPack() {
  const packId: string | null = useSearchParams().get('id');
  if (!packId) notFound();

  return <PackBuilderLoader packId={PackIdSchema.parse(packId)} />;
}

export default function EditPackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <EditedPack />
    </Suspense>
  );
}
