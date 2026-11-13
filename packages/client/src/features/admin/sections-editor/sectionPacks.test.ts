import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCatalogSection,
  buildPack,
  buildTheme,
  type CatalogSection,
  type Pack,
} from '@cityborn/api';
import {
  selectSectionPackCandidates,
  selectSectionPacks,
} from './sectionPacks';

const tennis: Pack = buildPack({ id: 'tennis', name: 'Tennis' });
const football: Pack = buildPack({
  id: 'football',
  name: 'Football',
  isPublished: false,
});
const rock: Pack = buildPack({
  id: 'rock',
  name: 'Rock',
  themeId: buildTheme({ id: '00000000-0000-4000-8000-000000000050' }).id,
});
const packs: Pack[] = [tennis, football, rock];
describe('selectSectionPackCandidates', () => {
  it('searches only admissible packs while preserving their publication status', () => {
    const section: CatalogSection = buildCatalogSection({
      themeId: tennis.themeId,
      packIds: [tennis.id],
    });

    assert.deepEqual(
      selectSectionPackCandidates({ section, packs, search: '  FOOT ' }),
      [football],
    );
    assert.deepEqual(
      selectSectionPackCandidates({ section, packs, search: 'rock' }),
      [],
    );
    assert.deepEqual(
      selectSectionPackCandidates({ section, packs, search: 'tennis' }),
      [],
    );
  });
  it('accepts every theme in the all filter and sorts the candidates by name', () => {
    assert.deepEqual(
      selectSectionPackCandidates({
        section: buildCatalogSection(),
        packs,
        search: '',
      }),
      [football, rock, tennis],
    );
  });
});
describe('selectSectionPacks', () => {
  it('shows every assigned pack in the persisted order including unpublished packs', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [tennis.id, 'deleted', football.id],
    });

    assert.deepEqual(selectSectionPacks({ section, packs }), [
      tennis,
      football,
    ]);
  });
});
