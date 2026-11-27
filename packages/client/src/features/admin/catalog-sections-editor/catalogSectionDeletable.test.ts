import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCatalogSection } from '@cityborn/api';
import { isCatalogSectionDeletable } from './catalogSectionDeletable';

describe('isCatalogSectionDeletable', () => {
  it('allows deleting a section created by an admin', () => {
    const isDeletable: boolean = isCatalogSectionDeletable(
      buildCatalogSection({ name: 'Évènements' }),
    );

    assert.equal(isDeletable, true);
  });

  it('forbids deleting the default section', () => {
    const isDeletable: boolean = isCatalogSectionDeletable(
      buildCatalogSection({ name: 'Tous les packs', isDefault: true }),
    );

    assert.equal(isDeletable, false);
  });
});
