import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ManifestEntrySchema } from './version-manifest.schema';

describe('ManifestEntrySchema', () => {
  it('rejects a file field instead of accepting the old manifest shape', () => {
    assert.equal(
      ManifestEntrySchema.safeParse({
        versionNumber: 1,
        releasedAt: '2026-10-24T00:00:00.000Z',
        file: 'v1-api.json',
      }).success,
      false,
    );
  });
});
