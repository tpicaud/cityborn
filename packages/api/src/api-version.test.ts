import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type {
  CompatPolicy,
  Manifest,
  ManifestEntry,
} from '../openapi/compat/types';
import { getApiVersionInfo, getCurrentApiVersion } from './api-version';

const NOW = new Date('2026-07-29T00:00:00.000Z');

function entry(versionNumber: number, daysAgo: number): ManifestEntry {
  const releasedAt = new Date(
    NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return { file: `api-v${versionNumber}.json`, versionNumber, releasedAt };
}

function manifest(versions: ManifestEntry[]): Manifest {
  return { versions };
}

const POLICY: CompatPolicy = {
  min_days_supported: 30,
  min_num_of_version_supported: 2,
};

describe('getCurrentApiVersion', () => {
  test('getCurrentApiVersion returns the highest version number regardless of manifest order', () => {
    const fixture = manifest([entry(2, 10), entry(5, 1), entry(3, 5)]);

    assert.equal(getCurrentApiVersion(fixture), 5);
  });

  test('getCurrentApiVersion returns the single version number when there is only one', () => {
    const fixture = manifest([entry(1, 1)]);

    assert.equal(getCurrentApiVersion(fixture), 1);
  });
});

describe('getApiVersionInfo', () => {
  test('getApiVersionInfo returns the lowest version number still selected by the compat policy', () => {
    const fixture = manifest([
      entry(5, 1),
      entry(4, 5),
      entry(3, 10),
      entry(2, 60),
    ]);

    const info = getApiVersionInfo(NOW, fixture, POLICY);

    assert.equal(info.minSupportedVersion, 3);
  });

  test('getApiVersionInfo throws when every version has aged out of the compat policy', () => {
    const fixture = manifest([entry(2, 90), entry(1, 120)]);
    const strictPolicy: CompatPolicy = {
      min_days_supported: 30,
      min_num_of_version_supported: 0,
    };

    assert.throws(() => getApiVersionInfo(NOW, fixture, strictPolicy));
  });

  test('getApiVersionInfo defaults now to the current date when not provided', () => {
    const fixture = manifest([entry(1, 1)]);

    const withExplicitNow = getApiVersionInfo(new Date(), fixture, POLICY);
    const withDefaultNow = getApiVersionInfo(undefined, fixture, POLICY);

    assert.equal(
      withDefaultNow.minSupportedVersion,
      withExplicitNow.minSupportedVersion,
    );
  });
});
