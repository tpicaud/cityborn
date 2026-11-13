import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCatalogSection,
  buildPack,
  buildTheme,
  type CatalogSection,
  type Pack,
  type Theme,
} from '@cityborn/api';
import {
  createPackCatalogSections,
  type PackCatalogSection,
} from './catalogSections';

const sport: Theme = buildTheme();
const music: Theme = buildTheme({ id: '00000000-0000-4000-8000-000000000051' });
const tennis: Pack = buildPack({
  id: 'tennis',
  name: 'Tennis',
  themeId: sport.id,
});
const football: Pack = buildPack({
  id: 'foot',
  name: 'Foot',
  themeId: sport.id,
});
const rock: Pack = buildPack({ id: 'rock', name: 'Rock', themeId: music.id });
const hidden: Pack = buildPack({
  id: 'hidden',
  name: 'Brouillon',
  isPublished: false,
  themeId: sport.id,
});
const packs: Pack[] = [tennis, football, rock, hidden];
describe('createPackCatalogSections', () => {
  it('keeps the administered order followed by every published pack in name order', () => {
    const sections: CatalogSection[] = [
      buildCatalogSection({
        name: 'Événements',
        packIds: [tennis.id, rock.id],
      }),
      buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000081',
        name: 'Nouveautés',
        packIds: [football.id, tennis.id],
      }),
    ];

    const result: PackCatalogSection[] = createPackCatalogSections({
      sections,
      packs,
      themeId: undefined,
    });

    assert.deepEqual(
      result.map(({ name, packs: sectionPacks }) => ({
        name,
        ids: sectionPacks.map(({ id }) => id),
      })),
      [
        { name: 'Événements', ids: ['tennis', 'rock'] },
        { name: 'Nouveautés', ids: ['foot', 'tennis'] },
        { name: 'Tous les packs', ids: ['foot', 'rock', 'tennis'] },
      ],
    );
  });
  it('shows sections exclusively in their own filter', () => {
    const sections: CatalogSection[] = [
      buildCatalogSection({ themeId: null, packIds: [tennis.id] }),
      buildCatalogSection({
        id: '00000000-0000-4000-8000-000000000081',
        themeId: sport.id,
        name: 'Tennis',
        packIds: [tennis.id],
      }),
    ];

    const result: PackCatalogSection[] = createPackCatalogSections({
      sections,
      packs,
      themeId: sport.id,
    });

    assert.deepEqual(
      result.map(({ name }) => name),
      ['Tennis', 'Tous les packs'],
    );
    assert.deepEqual(
      result[1]?.packs.map(({ id }) => id),
      ['foot', 'tennis'],
    );
    assert.deepEqual(
      createPackCatalogSections({ sections, packs, themeId: music.id }).map(
        ({ name }) => name,
      ),
      ['Tous les packs'],
    );
  });
  it('hides empty sections and unavailable memberships without affecting the complete catalogue', () => {
    const section: CatalogSection = buildCatalogSection({
      packIds: [hidden.id, 'deleted-pack'],
    });

    assert.deepEqual(
      createPackCatalogSections({
        sections: [section],
        packs,
        themeId: undefined,
      }),
      [
        {
          id: 'all-packs',
          name: 'Tous les packs',
          packs: [football, rock, tennis],
        },
      ],
    );
  });
  it('keeps the complete catalogue available without sections, including more than twenty-five packs', () => {
    const manyPacks: Pack[] = Array.from({ length: 26 }, (_, index) =>
      buildPack({
        id: `pack-${index}`,
        name: `Pack ${index.toString().padStart(2, '0')}`,
      }),
    );

    const result: PackCatalogSection[] = createPackCatalogSections({
      sections: [],
      packs: [...manyPacks].reverse(),
      themeId: undefined,
    });

    assert.equal(result.length, 1);
    assert.deepEqual(result[0]?.packs, manyPacks);
  });
  it('returns no sections without a published pack', () => {
    assert.deepEqual(
      createPackCatalogSections({
        sections: [buildCatalogSection()],
        packs: [hidden],
        themeId: undefined,
      }),
      [],
    );
  });
});
