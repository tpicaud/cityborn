import type { FullPack, Pack } from '@cityborn/api';
import type { QueryObserverResult } from '@tanstack/react-query';

export type PackEditorState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'loaded'; pack: FullPack; packs: Pack[] };

type PackEditorQueries = {
  fullPackQuery: QueryObserverResult<FullPack | null>;
  packsQuery: QueryObserverResult<Pack[]>;
};

function hasFailedWithoutData(query: QueryObserverResult<unknown>): boolean {
  return query.data === undefined && query.isError;
}

export function toPackEditorState({
  fullPackQuery,
  packsQuery,
}: PackEditorQueries): PackEditorState {
  if (hasFailedWithoutData(fullPackQuery) || hasFailedWithoutData(packsQuery)) {
    return { status: 'failed' };
  }
  if (fullPackQuery.data === null) return { status: 'missing' };
  if (fullPackQuery.data === undefined || packsQuery.data === undefined) {
    return { status: 'loading' };
  }
  return {
    status: 'loaded',
    pack: fullPackQuery.data,
    packs: packsQuery.data,
  };
}
