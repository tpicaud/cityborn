'use client';

import type { PackId } from '@cityborn/api';
import { type PackEditorLoad, usePackEditorLoad } from '@cityborn/client/admin';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { PackBuilder } from './pack-builder';

export function PackBuilderLoader({ packId }: { packId: PackId }) {
  const { packEditorState, retry }: PackEditorLoad = usePackEditorLoad({
    packId,
  });

  if (packEditorState.status === 'missing') notFound();

  if (packEditorState.status === 'failed') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Button variant="primary" onClick={retry}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (packEditorState.status === 'loading') {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <PackBuilder
      key={packEditorState.pack.id}
      editedPack={packEditorState.pack}
      packs={packEditorState.packs}
    />
  );
}
