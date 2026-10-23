import type { FullPack, Pack, Theme } from '@cityborn/api';
import type { QueryObserverResult } from '@tanstack/react-query';

export type PackEditorState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'loaded'; pack: FullPack; packs: Pack[]; themes: Theme[] };

type PackEditorQueries = {
  fullPackQuery: QueryObserverResult<FullPack | null>;
  packsQuery: QueryObserverResult<Pack[]>;
  themesQuery: QueryObserverResult<Theme[]>;
};

function hasFailedWithoutData(query: QueryObserverResult<unknown>): boolean {
  return query.data === undefined && query.isError;
}

export function toPackEditorState({
  fullPackQuery,
  packsQuery,
  themesQuery,
}: PackEditorQueries): PackEditorState {
  if (
    hasFailedWithoutData(fullPackQuery) ||
    hasFailedWithoutData(packsQuery) ||
    hasFailedWithoutData(themesQuery)
  ) {
    return { status: 'failed' };
  }
  if (fullPackQuery.data === null) return { status: 'missing' };
  if (
    fullPackQuery.data === undefined ||
    packsQuery.data === undefined ||
    themesQuery.data === undefined
  ) {
    return { status: 'loading' };
  }
  return {
    status: 'loaded',
    pack: fullPackQuery.data,
    packs: packsQuery.data,
    themes: themesQuery.data,
  };
}
