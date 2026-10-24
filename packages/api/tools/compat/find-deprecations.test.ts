import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Manifest } from '../../src/protocol/version-manifest.schema';
import {
  type DeprecationStatus,
  resolveDeprecationStatus,
} from './find-deprecations';

describe('resolveDeprecationStatus', () => {
  const manifest: Manifest = {
    versions: [
      { versionNumber: 1, releasedAt: '2026-06-01T00:00:00.000Z' },
      { versionNumber: 2, releasedAt: '2026-07-01T00:00:00.000Z' },
      { versionNumber: 3, releasedAt: '2026-10-01T00:00:00.000Z' },
    ],
  };

  it('allows removal when the origin version leaves both support windows', () => {
    const status: DeprecationStatus = resolveDeprecationStatus(
      '2026-05-31',
      manifest,
      { min_days_supported: 90, min_num_of_version_supported: 2 },
      new Date('2026-10-24T00:00:00.000Z'),
    );

    assert.deepEqual(status, {
      kind: 'eligible',
      originVersion: {
        versionNumber: 1,
        releasedAt: '2026-06-01T00:00:00.000Z',
      },
    });
  });

  it('waits for enough newer versions after the day window expires', () => {
    const status: DeprecationStatus = resolveDeprecationStatus(
      '2026-06-30',
      manifest,
      { min_days_supported: 90, min_num_of_version_supported: 2 },
      new Date('2026-10-24T00:00:00.000Z'),
    );

    assert.deepEqual(status, {
      kind: 'pending',
      originVersion: {
        versionNumber: 2,
        releasedAt: '2026-07-01T00:00:00.000Z',
      },
      dayWindowExpiresAt: '2026-09-29T00:00:00.000Z',
      versionsStillNeeded: 1,
    });
  });
});
