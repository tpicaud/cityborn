import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTheme, type ThemeId } from '@cityborn/api';
import {
  initialThemeEditorState,
  type ThemeEditorState,
  themeEditorReducer,
} from './themeEditorState';

const id: ThemeId = buildTheme().id;
describe('themeEditorReducer', () => {
  it('closes the edit when confirming a deletion', () => {
    const editing: ThemeEditorState = themeEditorReducer(
      initialThemeEditorState,
      { type: 'edit', id },
    );

    const confirming: ThemeEditorState = themeEditorReducer(editing, {
      type: 'confirmDeletion',
      id,
    });

    assert.equal(confirming.editedThemeId, null);
    assert.equal(confirming.deletionThemeId, id);
  });
  it('closes the deletion confirmation after a successful save', () => {
    const state: ThemeEditorState = {
      ...initialThemeEditorState,
      deletionThemeId: id,
    };

    const saved: ThemeEditorState = themeEditorReducer(state, {
      type: 'saved',
    });

    assert.equal(saved.deletionThemeId, null);
  });
});
