import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SaveThemeSchema, ThemeIconNameSchema } from './theme.schema';

describe('SaveThemeSchema', () => {
  it('trims a valid name', () => {
    assert.deepEqual(SaveThemeSchema.parse({ name: '  Cinéma  ' }), {
      name: 'Cinéma',
    });
  });
  it('rejects blank names', () => {
    assert.equal(SaveThemeSchema.safeParse({ name: '   ' }).success, false);
  });
  it('rejects names longer than forty characters', () => {
    assert.equal(
      SaveThemeSchema.safeParse({ name: 'a'.repeat(41) }).success,
      false,
    );
  });
  it('accepts forty characters after trimming', () => {
    assert.equal(
      SaveThemeSchema.parse({ name: `  ${'a'.repeat(40)} ` }).name.length,
      40,
    );
  });
});

describe('ThemeIconNameSchema', () => {
  it('trims an Iconify icon name', () => {
    assert.equal(
      ThemeIconNameSchema.parse('  fluent:sport-basketball-24-filled '),
      'fluent:sport-basketball-24-filled',
    );
  });
  it('rejects a name without icon set prefix', () => {
    assert.equal(ThemeIconNameSchema.safeParse('basketball').success, false);
  });
  it('rejects a name that could escape the Iconify path', () => {
    assert.equal(
      ThemeIconNameSchema.safeParse('boxicons:../music-alt-filled').success,
      false,
    );
  });
});
