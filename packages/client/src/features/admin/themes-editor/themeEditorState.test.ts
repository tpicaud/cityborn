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
  it('keeps a failed rename open and associates its error with the row', () => {
    const editing: ThemeEditorState = themeEditorReducer(
      initialThemeEditorState,
      { type: 'edit', id },
    );
    const failed: ThemeEditorState = themeEditorReducer(editing, {
      type: 'rowError',
      id,
      message: 'Ce thème existe déjà',
    });
    assert.equal(failed.editedThemeId, id);
    assert.equal(failed.rowErrors[id], 'Ce thème existe déjà');
  });
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
  it('cancels without changing the creation error', () => {
    const state: ThemeEditorState = {
      ...initialThemeEditorState,
      editedThemeId: id,
      creationError: 'Ce thème existe déjà',
    };
    const cancelled: ThemeEditorState = themeEditorReducer(state, {
      type: 'cancel',
    });
    assert.equal(cancelled.editedThemeId, null);
    assert.equal(cancelled.creationError, 'Ce thème existe déjà');
  });
  it('clears the row error after a successful save', () => {
    const state: ThemeEditorState = {
      ...initialThemeEditorState,
      deletionThemeId: id,
      rowErrors: { [id]: 'Suppression impossible' },
    };
    const saved: ThemeEditorState = themeEditorReducer(state, {
      type: 'saved',
      id,
    });
    assert.equal(saved.deletionThemeId, null);
    assert.equal(saved.rowErrors[id], undefined);
  });
});
