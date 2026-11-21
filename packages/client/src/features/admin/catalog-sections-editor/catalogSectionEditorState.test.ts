import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCatalogSection, type CatalogSectionId } from '@cityborn/api';
import {
  type CatalogSectionEditorState,
  catalogSectionEditorReducer,
  initialCatalogSectionEditorState,
} from './catalogSectionEditorState';

const id: CatalogSectionId = buildCatalogSection().id;

describe('catalogSectionEditorReducer', () => {
  it('asks for a confirmation before deleting', () => {
    const confirming: CatalogSectionEditorState = catalogSectionEditorReducer(
      initialCatalogSectionEditorState,
      { type: 'confirmDeletion', id },
    );

    assert.equal(confirming.deletionSectionId, id);
  });

  it('closes the confirmation when the deletion is cancelled', () => {
    const confirming: CatalogSectionEditorState = {
      ...initialCatalogSectionEditorState,
      deletionSectionId: id,
    };

    const cancelled: CatalogSectionEditorState = catalogSectionEditorReducer(
      confirming,
      { type: 'cancel' },
    );

    assert.equal(cancelled.deletionSectionId, null);
  });

  it('keeps a failed rename open and associates its error with the row', () => {
    const editing: CatalogSectionEditorState = catalogSectionEditorReducer(
      initialCatalogSectionEditorState,
      { type: 'edit', id },
    );

    const failed: CatalogSectionEditorState = catalogSectionEditorReducer(
      editing,
      { type: 'rowError', id, message: 'Cette section existe déjà' },
    );

    assert.equal(failed.editedSectionId, id);
    assert.equal(failed.rowErrors[id], 'Cette section existe déjà');
  });
});
