import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SaveCatalogSectionSchema } from './catalog-section.schema';

describe('SaveCatalogSectionSchema', () => {
  it('trims a valid name', () => {
    assert.deepEqual(
      SaveCatalogSectionSchema.parse({ name: '  Évènements  ' }),
      {
        name: 'Évènements',
      },
    );
  });

  it('rejects a blank name', () => {
    assert.equal(
      SaveCatalogSectionSchema.safeParse({ name: '   ' }).success,
      false,
    );
  });

  it('accepts forty characters after trimming', () => {
    assert.equal(
      SaveCatalogSectionSchema.parse({ name: ` ${'a'.repeat(40)} ` }).name
        .length,
      40,
    );
  });

  it('rejects a name longer than forty characters', () => {
    assert.equal(
      SaveCatalogSectionSchema.safeParse({ name: 'a'.repeat(41) }).success,
      false,
    );
  });
});
