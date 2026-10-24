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

export function synchronizePackDraft({
  pack,
  loadedPack,
  editedPack,
}: {
  pack: FullPack;
  loadedPack: FullPack;
  editedPack: FullPack;
}): FullPack {
  if (pack.id !== editedPack.id) return editedPack;
  return {
    ...editedPack,
    ...(pack.name !== loadedPack.name ? { name: pack.name } : {}),
    ...(pack.description !== loadedPack.description
      ? { description: pack.description }
      : {}),
    ...(pack.parentId !== loadedPack.parentId
      ? { parentId: pack.parentId }
      : {}),
    ...(pack.themeId !== loadedPack.themeId ? { themeId: pack.themeId } : {}),
    ...(pack.isPublished !== loadedPack.isPublished
      ? { isPublished: pack.isPublished }
      : {}),
    ...(pack.guessObjects !== loadedPack.guessObjects
      ? { guessObjects: pack.guessObjects }
      : {}),
  };
}

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
