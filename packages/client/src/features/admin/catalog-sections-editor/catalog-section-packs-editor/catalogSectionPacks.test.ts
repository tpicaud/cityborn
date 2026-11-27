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
import {
  areCatalogSectionPacksEditable,
  searchCatalogSectionPackCandidates,
  selectCatalogSectionPacks,
} from './catalogSectionPacks';

const monuments: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000070',
  name: 'Monuments',
});
const capitals: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000071',
  name: 'Capitales européennes',
  isPublished: false,
});
const rivers: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000072',
  name: 'Fleuves',
});

describe('areCatalogSectionPacksEditable', () => {
  it('lets the packs of an admin section be edited', () => {
    assert.equal(areCatalogSectionPacksEditable(buildCatalogSection()), true);
  });

  it('keeps the default section holding every published pack', () => {
    assert.equal(
      areCatalogSectionPacksEditable(buildCatalogSection({ isDefault: true })),
      false,
    );
  });
});

describe('selectCatalogSectionPacks', () => {
  it('lists the packs of the section in order of addition', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [rivers.id, capitals.id],
    });

    const packs: Pack[] = selectCatalogSectionPacks({
      section,
      packs: [monuments, capitals, rivers],
    });

    assert.deepEqual(packs, [rivers, capitals]);
  });

  it('skips a pack missing from the loaded packs', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [monuments.id, rivers.id],
    });

    const packs: Pack[] = selectCatalogSectionPacks({
      section,
      packs: [rivers],
    });

    assert.deepEqual(packs, [rivers]);
  });
});

describe('searchCatalogSectionPackCandidates', () => {
  it('finds the packs outside the section by name, ignoring case and accents', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [monuments.id],
    });

    const packs: Pack[] = searchCatalogSectionPackCandidates({
      section,
      packs: [monuments, capitals, rivers],
      query: ' EUROPEENNES ',
    });

    assert.deepEqual(packs, [capitals]);
  });

  it('lists every pack outside the section by name without a query', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [capitals.id],
    });

    const packs: Pack[] = searchCatalogSectionPackCandidates({
      section,
      packs: [monuments, capitals, rivers],
      query: '',
    });

    assert.deepEqual(packs, [rivers, monuments]);
  });

  it('lists only the packs of the theme of a theme section', () => {
    const sportThemeId: ThemeId = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
    }).id;
    const football: Pack = buildPack({
      id: '00000000-0000-4000-8000-000000000073',
      name: 'Football',
      themeId: sportThemeId,
    });
    const section: CatalogSection = buildCatalogSection({
      themeId: sportThemeId,
    });

    const packs: Pack[] = searchCatalogSectionPackCandidates({
      section,
      packs: [monuments, football, rivers],
      query: '',
    });

    assert.deepEqual(packs, [football]);
  });
});
