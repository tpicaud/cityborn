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

  it('keeps published versions until a draft is released', () => {
    const versions: ManifestEntry[] = [
      { versionNumber: 4, releasedAt: '2026-09-25T00:00:00.000Z' },
      { versionNumber: 5, releasedAt: '2026-10-23T00:00:00.000Z' },
      { versionNumber: 6, releasedAt: '2026-11-04T00:00:00.000Z' },
      { versionNumber: 7, releasedAt: '2026-11-06T00:00:00.000Z', draft: true },
    ];

    const selected: ManifestEntry[] = selectVersionsToCheck(
      versions,
      { min_days_supported: 30, min_num_of_version_supported: 3 },
      new Date('2026-11-06T12:00:00.000Z'),
    );
    const selectedAfterRelease: ManifestEntry[] = selectVersionsToCheck(
      versions.map((entry) => ({ ...entry, draft: false })),
      { min_days_supported: 30, min_num_of_version_supported: 3 },
      new Date('2026-11-06T12:00:00.000Z'),
    );

    assert.deepEqual(
      selected.map((entry) => entry.versionNumber),
      [7, 6, 5, 4],
    );
    assert.deepEqual(
      selectedAfterRelease.map((entry) => entry.versionNumber),
      [7, 6, 5],
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
