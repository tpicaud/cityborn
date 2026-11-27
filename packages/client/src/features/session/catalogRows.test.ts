import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCatalogSection,
  buildPack,
  buildTheme,
  type CatalogSection,
  type Pack,
  type ThemeId,
} from '@cityborn/api';
import { type CatalogRow, createCatalogRows } from './catalogRows';

const sportThemeId: ThemeId = buildTheme({
  id: '00000000-0000-4000-8000-000000000050',
}).id;
const tennis: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000070',
  name: 'Tennis',
  themeId: sportThemeId,
});
const capitals: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000071',
  name: 'Capitales',
});
const rivers: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000072',
  name: 'Fleuves',
});
const catalog: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000060',
  name: 'Catalogue',
  isDefault: true,
});
const events: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000061',
  name: 'Évènements',
  packIds: [tennis.id, rivers.id, capitals.id],
});

describe('createCatalogRows', () => {
  it('lists every section in order, with its packs in order of addition', () => {
    const rows: CatalogRow[] = createCatalogRows({
      sections: [events, catalog],
      publishedPacks: [tennis, capitals, rivers],
      themeId: undefined,
    });

    assert.deepEqual(rows, [
      {
        key: events.id,
        title: 'Évènements',
        packs: [tennis, rivers, capitals],
      },
      { key: 'all', title: 'Catalogue', packs: [capitals, rivers, tennis] },
    ]);
  });

  it('keeps only the published packs of a section and hides it without any', () => {
    const news: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000062',
      name: 'Nouveautés',
      packIds: [capitals.id],
    });

    const rows: CatalogRow[] = createCatalogRows({
      sections: [catalog, events, news],
      publishedPacks: [tennis, rivers],
      themeId: undefined,
    });

    assert.deepEqual(rows, [
      { key: 'all', title: 'Catalogue', packs: [rivers, tennis] },
      { key: events.id, title: 'Évènements', packs: [tennis, rivers] },
    ]);
  });

  it('lists only the packs of the selected theme', () => {
    const rows: CatalogRow[] = createCatalogRows({
      sections: [events, catalog],
      publishedPacks: [tennis, capitals, rivers],
      themeId: sportThemeId,
    });

    assert.deepEqual(rows, [
      { key: sportThemeId, title: 'Catalogue', packs: [tennis] },
    ]);
  });

  it('keeps every published pack under the original title without sections', () => {
    const rows: CatalogRow[] = createCatalogRows({
      sections: [],
      publishedPacks: [rivers, capitals],
      themeId: undefined,
    });

    assert.deepEqual(rows, [
      { key: 'all', title: 'Tous les packs', packs: [capitals, rivers] },
    ]);
  });

  it('lists no row without published pack', () => {
    const rows: CatalogRow[] = createCatalogRows({
      sections: [catalog, events],
      publishedPacks: [],
      themeId: undefined,
    });

    assert.deepEqual(rows, []);
  });
});
