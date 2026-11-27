import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTheme, type ThemeId } from '@cityborn/api';
import {
  initialOrderedListEditorState,
  type OrderedListEditorState,
  orderedListEditorReducer,
} from './orderedListEditorState';

const id: ThemeId = buildTheme().id;

describe('orderedListEditorReducer', () => {
  it('asks for a confirmation before deleting', () => {
    const confirming: OrderedListEditorState<ThemeId> =
      orderedListEditorReducer<ThemeId>(initialOrderedListEditorState, {
        type: 'confirmDeletion',
        id,
      });

    assert.equal(confirming.deletionId, id);
  });

  it('closes the edit when confirming a deletion', () => {
    const editing: OrderedListEditorState<ThemeId> =
      orderedListEditorReducer<ThemeId>(initialOrderedListEditorState, {
        type: 'edit',
        id,
      });

    const confirming: OrderedListEditorState<ThemeId> =
      orderedListEditorReducer(editing, { type: 'confirmDeletion', id });

    assert.equal(confirming.editedId, null);
    assert.equal(confirming.deletionId, id);
  });

  it('closes the confirmation when the deletion is cancelled', () => {
    const confirming: OrderedListEditorState<ThemeId> = {
      ...initialOrderedListEditorState,
      deletionId: id,
    };

    const cancelled: OrderedListEditorState<ThemeId> = orderedListEditorReducer(
      confirming,
      { type: 'cancel' },
    );

    assert.equal(cancelled.deletionId, null);
  });

  it('closes the deletion confirmation after a successful save', () => {
    const confirming: OrderedListEditorState<ThemeId> = {
      ...initialOrderedListEditorState,
      deletionId: id,
    };

    const saved: OrderedListEditorState<ThemeId> = orderedListEditorReducer(
      confirming,
      { type: 'saved' },
    );

    assert.equal(saved.deletionId, null);
  });
});
