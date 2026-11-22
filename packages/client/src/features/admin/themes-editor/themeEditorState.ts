import type { ThemeId } from '@cityborn/api';
export type ThemeEditorState = {
  editedThemeId: ThemeId | null;
  deletionThemeId: ThemeId | null;
};
type ThemeEditorAction =
  | { type: 'edit'; id: ThemeId }
  | { type: 'confirmDeletion'; id: ThemeId }
  | { type: 'cancel' }
  | { type: 'saved' };
export const initialThemeEditorState: ThemeEditorState = {
  editedThemeId: null,
  deletionThemeId: null,
};
export function themeEditorReducer(
  state: ThemeEditorState,
  action: ThemeEditorAction,
): ThemeEditorState {
  switch (action.type) {
    case 'edit':
      return { ...state, editedThemeId: action.id, deletionThemeId: null };
    case 'confirmDeletion':
      return { ...state, editedThemeId: null, deletionThemeId: action.id };
    case 'cancel':
    case 'saved':
      return { ...state, editedThemeId: null, deletionThemeId: null };
  }
}
