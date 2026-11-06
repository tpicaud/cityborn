import type { FullPack, Theme } from '@cityborn/api';
import type { QueryObserverResult } from '@tanstack/react-query';

export type PackEditorState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'loaded'; pack: FullPack; themes: Theme[] };

type PackEditorQueries = {
  fullPackQuery: QueryObserverResult<FullPack | null>;
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
    ...(pack.image !== loadedPack.image ? { image: pack.image } : {}),
    ...(pack.themeId !== loadedPack.themeId ? { themeId: pack.themeId } : {}),
    ...(pack.isPublished !== loadedPack.isPublished
      ? { isPublished: pack.isPublished }
      : {}),
    ...(pack.guessObjects !== loadedPack.guessObjects
      ? { guessObjects: pack.guessObjects }
      : {}),
  };
}

export function selectPackImagePreview({
  pack,
  editedPack,
}: {
  pack: FullPack;
  editedPack: FullPack;
}): string | undefined {
  return pack.image || editedPack.image;
}

function hasFailedWithoutData(query: QueryObserverResult<unknown>): boolean {
  return query.data === undefined && query.isError;
}

export function toPackEditorState({
  fullPackQuery,
  themesQuery,
}: PackEditorQueries): PackEditorState {
  if (
    hasFailedWithoutData(fullPackQuery) ||
    hasFailedWithoutData(themesQuery)
  ) {
    return { status: 'failed' };
  }
  if (fullPackQuery.data === null) return { status: 'missing' };
  if (fullPackQuery.data === undefined || themesQuery.data === undefined) {
    return { status: 'loading' };
  }
  return {
    status: 'loaded',
    pack: fullPackQuery.data,
    themes: themesQuery.data,
  };
}
