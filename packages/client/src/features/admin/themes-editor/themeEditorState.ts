import type { ThemeId } from '@cityborn/api';
export type ThemeEditorState = {
  editedThemeId: ThemeId | null;
  deletionThemeId: ThemeId | null;
  creationError: string | null;
  rowErrors: Partial<Record<ThemeId, string>>;
};
export type ThemeEditorAction =
  | { type: 'edit'; id: ThemeId }
  | { type: 'confirmDeletion'; id: ThemeId }
  | { type: 'cancel' }
  | { type: 'creationError'; message: string | null }
  | { type: 'rowError'; id: ThemeId; message: string }
  | { type: 'saved'; id: ThemeId };
export const initialThemeEditorState: ThemeEditorState = {
  editedThemeId: null,
  deletionThemeId: null,
  creationError: null,
  rowErrors: {},
};
export function themeEditorReducer(
  state: ThemeEditorState,
  action: ThemeEditorAction,
): ThemeEditorState {
  switch (action.type) {
    case 'edit':
      return {
        ...state,
        editedThemeId: action.id,
        deletionThemeId: null,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
    case 'confirmDeletion':
      return {
        ...state,
        editedThemeId: null,
        deletionThemeId: action.id,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
    case 'cancel':
      return { ...state, editedThemeId: null, deletionThemeId: null };
    case 'creationError':
      return { ...state, creationError: action.message };
    case 'rowError':
      return {
        ...state,
        rowErrors: { ...state.rowErrors, [action.id]: action.message },
      };
    case 'saved':
      return {
        ...state,
        editedThemeId: null,
        deletionThemeId: null,
        rowErrors: { ...state.rowErrors, [action.id]: undefined },
      };
  }
}
