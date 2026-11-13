import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CatalogSectionNameSchema } from './catalog-section.schema';

describe('CatalogSectionNameSchema', () => {
  it('trims names and preserves accented letters', () => {
    assert.equal(
      CatalogSectionNameSchema.parse('  Événements  '),
      'Événements',
    );
  });
  it('accepts forty characters after trimming', () => {
    assert.equal(
      CatalogSectionNameSchema.parse(` ${'a'.repeat(40)} `).length,
      40,
    );
  });
  it('rejects empty names and names longer than forty characters', () => {
    ['', '  ', 'a'.repeat(41)].forEach((name: string) => {
      assert.equal(CatalogSectionNameSchema.safeParse(name).success, false);
    });
  });
  it('reserves the complete catalogue name regardless of case and outer whitespace', () => {
    assert.equal(
      CatalogSectionNameSchema.safeParse('  TOUS les PACKS  ').success,
      false,
    );
  });
});
