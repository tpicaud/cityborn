import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTheme, type Theme } from '@cityborn/api';
import { findThemeName } from './themeName';

describe('findThemeName', () => {
  it('returns the name of the pack theme', () => {
    const miscellaneousTheme: Theme = buildTheme();
    const sportTheme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
      name: 'Sport',
    });

    const themeName: string | undefined = findThemeName({
      themes: [miscellaneousTheme, sportTheme],
      themeId: sportTheme.id,
    });

    assert.equal(themeName, 'Sport');
  });

  it('returns nothing while the theme is not listed', () => {
    const sportTheme: Theme = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
      name: 'Sport',
    });

    const themeName: string | undefined = findThemeName({
      themes: [],
      themeId: sportTheme.id,
    });

    assert.equal(themeName, undefined);
  });
});
