import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCatalogSection } from '@cityborn/api';
import { findAllPacksRowTitle } from './allPacksRowTitle';

describe('findAllPacksRowTitle', () => {
  it('uses the name given to the default section', () => {
    const title: string = findAllPacksRowTitle([
      buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000060',
        name: 'Nouveautés',
      }),
      buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000061',
        name: 'Catalogue',
        isDefault: true,
      }),
    ]);

    assert.equal(title, 'Catalogue');
  });

  it('falls back to the original name without sections', () => {
    const title: string = findAllPacksRowTitle([]);

    assert.equal(title, 'Tous les packs');
  });
});
