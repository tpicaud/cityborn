import type { CatalogSectionId } from '@cityborn/api';

export type CatalogSectionEditorState = {
  editedSectionId: CatalogSectionId | null;
  deletionSectionId: CatalogSectionId | null;
};

type CatalogSectionEditorAction =
  | { type: 'edit'; id: CatalogSectionId }
  | { type: 'confirmDeletion'; id: CatalogSectionId }
  | { type: 'cancel' }
  | { type: 'saved' };

export const initialCatalogSectionEditorState: CatalogSectionEditorState = {
  editedSectionId: null,
  deletionSectionId: null,
};

export function catalogSectionEditorReducer(
  state: CatalogSectionEditorState,
  action: CatalogSectionEditorAction,
): CatalogSectionEditorState {
  switch (action.type) {
    case 'edit':
      return { ...state, editedSectionId: action.id, deletionSectionId: null };
    case 'confirmDeletion':
      return { ...state, editedSectionId: null, deletionSectionId: action.id };
    case 'cancel':
    case 'saved':
      return { ...state, editedSectionId: null, deletionSectionId: null };
  }
}
