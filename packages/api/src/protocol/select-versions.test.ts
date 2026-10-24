import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { selectVersionsToCheck } from './select-versions';
import type { ManifestEntry } from './version-manifest.schema';

describe('selectVersionsToCheck', () => {
  it('keeps recent versions once each even beyond the minimum version count', () => {
    const versions: ManifestEntry[] = [
      { versionNumber: 1, releasedAt: '2026-07-01T00:00:00.000Z' },
      { versionNumber: 2, releasedAt: '2026-10-01T00:00:00.000Z' },
      { versionNumber: 3, releasedAt: '2026-10-02T00:00:00.000Z', draft: true },
    ];

    const selected: ManifestEntry[] = selectVersionsToCheck(
      versions,
      { min_days_supported: 90, min_num_of_version_supported: 1 },
      new Date('2026-10-24T00:00:00.000Z'),
    );

    assert.deepEqual(
      selected.map((entry) => entry.versionNumber),
      [3, 2],
    );
  });

  it('keeps the minimum version count after the day window expires', () => {
    const versions: ManifestEntry[] = [
      { versionNumber: 1, releasedAt: '2026-06-01T00:00:00.000Z' },
      { versionNumber: 2, releasedAt: '2026-07-01T00:00:00.000Z' },
      { versionNumber: 3, releasedAt: '2026-10-01T00:00:00.000Z' },
    ];

    const selected: ManifestEntry[] = selectVersionsToCheck(
      versions,
      { min_days_supported: 90, min_num_of_version_supported: 2 },
      new Date('2026-10-24T00:00:00.000Z'),
    );

    assert.deepEqual(
      selected.map((entry) => entry.versionNumber),
      [3, 2],
    );
  });

  it('retires versions at or below the deprecation floor despite the support policy', () => {
    const versions: ManifestEntry[] = [
      { versionNumber: 1, releasedAt: '2026-10-01T00:00:00.000Z' },
      {
        versionNumber: 2,
        releasedAt: '2026-10-02T00:00:00.000Z',
        deprecatedAt: '2026-10-23',
        deprecationReason: 'Clients have upgraded',
      },
      { versionNumber: 3, releasedAt: '2026-10-03T00:00:00.000Z' },
    ];

    const selected: ManifestEntry[] = selectVersionsToCheck(
      versions,
      { min_days_supported: 90, min_num_of_version_supported: 3 },
      new Date('2026-10-24T00:00:00.000Z'),
    );

    assert.deepEqual(
      selected.map((entry) => entry.versionNumber),
      [3],
    );
  });
});
