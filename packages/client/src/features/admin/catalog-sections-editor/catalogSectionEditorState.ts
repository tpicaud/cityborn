import type { CatalogSectionId } from '@cityborn/api';

export type CatalogSectionEditorState = {
  editedSectionId: CatalogSectionId | null;
  deletionSectionId: CatalogSectionId | null;
  creationError: string | null;
  rowErrors: Partial<Record<CatalogSectionId, string>>;
};

type CatalogSectionEditorAction =
  | { type: 'edit'; id: CatalogSectionId }
  | { type: 'confirmDeletion'; id: CatalogSectionId }
  | { type: 'cancel' }
  | { type: 'creationError'; message: string | null }
  | { type: 'rowError'; id: CatalogSectionId; message: string }
  | { type: 'moved'; id: CatalogSectionId }
  | { type: 'saved'; id: CatalogSectionId };

export const initialCatalogSectionEditorState: CatalogSectionEditorState = {
  editedSectionId: null,
  deletionSectionId: null,
  creationError: null,
  rowErrors: {},
};

export function catalogSectionEditorReducer(
  state: CatalogSectionEditorState,
  action: CatalogSectionEditorAction,
): CatalogSectionEditorState {
  switch (action.type) {
    case 'edit':
      return {
        ...state,
        editedSectionId: action.id,
        deletionSectionId: null,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
    case 'confirmDeletion':
      return {
        ...state,
        editedSectionId: null,
        deletionSectionId: action.id,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
    case 'cancel':
      return { ...state, editedSectionId: null, deletionSectionId: null };
    case 'creationError':
      return { ...state, creationError: action.message };
    case 'rowError':
      return {
        ...state,
        rowErrors: { ...state.rowErrors, [action.id]: action.message },
      };
    case 'moved':
      return {
        ...state,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
    case 'saved':
      return {
        ...state,
        editedSectionId: null,
        deletionSectionId: null,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
  }
}
