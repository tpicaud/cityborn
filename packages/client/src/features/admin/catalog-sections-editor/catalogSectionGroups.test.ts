import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCatalogSection,
  buildTheme,
  type CatalogSection,
  type Theme,
} from '@cityborn/api';
import {
  type CatalogSectionGroup,
  createCatalogSectionGroups,
} from './catalogSectionGroups';

const sport: Theme = buildTheme({
  id: '00000000-0000-4000-8000-000000000050',
  name: 'Sport',
});
const music: Theme = buildTheme({
  id: '00000000-0000-4000-8000-000000000051',
  name: 'Musique',
});

describe('createCatalogSectionGroups', () => {
  it('groups the sections by filter, the all packs filter first, then each theme in order', () => {
    const news: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000060',
      name: 'Nouveautés',
    });
    const tennis: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000061',
      name: 'Tennis',
      themeId: sport.id,
    });
    const football: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000062',
      name: 'Foot',
      themeId: sport.id,
    });

    const groups: CatalogSectionGroup[] = createCatalogSectionGroups({
      sections: [tennis, news, football],
      themes: [sport, music],
    });

    assert.deepEqual(groups, [
      { key: 'all', filterValue: '', title: 'Tous', sections: [news] },
      {
        key: sport.id,
        filterValue: sport.id,
        title: 'Sport',
        sections: [tennis, football],
      },
      { key: music.id, filterValue: music.id, title: 'Musique', sections: [] },
    ]);
  });
});
