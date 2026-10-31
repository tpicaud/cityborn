import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPack,
  buildTheme,
  type Pack,
  type Theme,
  type ThemeId,
} from '@cityborn/api';
import { selectThemePacks } from './themePacks';

const sportThemeId: ThemeId = buildTheme({
  id: '00000000-0000-4000-8000-000000000050',
}).id;
const musicTheme: Theme = buildTheme({
  id: '00000000-0000-4000-8000-000000000051',
});
const tennis: Pack = buildPack({
  id: 'tennis',
  name: 'Tennis',
  themeId: sportThemeId,
});
const athletics: Pack = buildPack({
  id: 'athletics',
  name: 'Athlétisme',
  themeId: sportThemeId,
});
const rock: Pack = buildPack({
  id: 'rock',
  name: 'Rock',
  themeId: musicTheme.id,
});
const basketball: Pack = buildPack({
  id: 'basketball',
  name: 'Basket',
  themeId: sportThemeId,
});

describe('selectThemePacks', () => {
  it('lists every pack by name without a theme', () => {
    const packs: Pack[] = selectThemePacks({
      packs: [tennis, rock, athletics, basketball],
      themeId: undefined,
    });

    assert.deepEqual(packs, [athletics, basketball, rock, tennis]);
  });

  it('lists only the packs of the theme by name', () => {
    const packs: Pack[] = selectThemePacks({
      packs: [tennis, rock, athletics, basketball],
      themeId: sportThemeId,
    });

    assert.deepEqual(packs, [athletics, basketball, tennis]);
  });
});
