import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SaveThemeSchema } from './theme.schema';

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
