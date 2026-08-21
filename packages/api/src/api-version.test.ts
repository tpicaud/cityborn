import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { selectVersionsToCheck } from '../openapi/compat/select-versions';
import type {
  CompatPolicy,
  Manifest,
  ManifestEntry,
} from '../openapi/compat/types';
import { getApiVersionInfo } from './api-version';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiDir = join(__dirname, '../openapi');

const NOW = new Date('2026-07-29T00:00:00.000Z');

function entry(versionNumber: number, daysAgo: number): ManifestEntry {
  const releasedAt = new Date(
    NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return { file: `api-v${versionNumber}.json`, versionNumber, releasedAt };
}

function deprecate(e: ManifestEntry): ManifestEntry {
  return { ...e, deprecatedAt: NOW.toISOString(), deprecationReason: 'test' };
}

function writeFixture(
  versions: ManifestEntry[],
  policy: CompatPolicy,
): { manifestFile: string; policyFile: string } {
  const dir = mkdtempSync(join(tmpdir(), 'api-version-'));
  const manifestFile = join(dir, 'manifest.json');
  writeFileSync(manifestFile, JSON.stringify({ versions }));
  const policyFile = join(dir, 'policy.yaml');
  writeFileSync(
    policyFile,
    `min_days_supported: ${policy.min_days_supported}\nmin_num_of_version_supported: ${policy.min_num_of_version_supported}\n`,
  );
  return { manifestFile, policyFile };
}

describe('getApiVersionInfo', () => {
  test('returns the lowest version number still selected by selectVersionsToCheck on the real manifest/policy', () => {
    const manifest = JSON.parse(
      readFileSync(
        join(openapiDir, 'versions/versions-manifest.json'),
        'utf-8',
      ),
    ) as Manifest;
    const policy = load(
      readFileSync(join(openapiDir, 'compat-policy.yaml'), 'utf-8'),
    ) as CompatPolicy;

    const info = getApiVersionInfo();

    const expectedVersions = selectVersionsToCheck(
      manifest.versions,
      policy,
      new Date(),
    );
    const expectedMinSupportedVersion = Math.min(
      ...expectedVersions.map((v) => v.versionNumber),
    );

    assert.equal(info.minSupportedVersion, expectedMinSupportedVersion);
  });

  test('caches the result across calls that use the default files', () => {
    const first = getApiVersionInfo();
    const second = getApiVersionInfo();

    assert.strictEqual(first, second);
  });

  test('computes the min supported version from an explicit manifest/policy override', () => {
    const versions = [
      entry(5, 1),
      entry(4, 5),
      entry(3, 10),
      entry(2, 40),
      entry(1, 60),
    ];
    const { manifestFile, policyFile } = writeFixture(versions, {
      min_days_supported: 30,
      min_num_of_version_supported: 2,
    });

    const info = getApiVersionInfo({ manifestFile, policyFile, now: NOW });

    assert.equal(info.minSupportedVersion, 3);
  });

  test('excludes versions cascaded out by a deprecation marker', () => {
    const versions = [
      entry(4, 60),
      deprecate(entry(3, 60)),
      entry(2, 60),
      entry(1, 60),
    ];
    const { manifestFile, policyFile } = writeFixture(versions, {
      min_days_supported: 30,
      min_num_of_version_supported: 3,
    });

    const info = getApiVersionInfo({ manifestFile, policyFile, now: NOW });

    assert.equal(info.minSupportedVersion, 4);
  });

  test('throws when every version is deprecated', () => {
    const versions = [deprecate(entry(2, 1)), deprecate(entry(1, 5))];
    const { manifestFile, policyFile } = writeFixture(versions, {
      min_days_supported: 30,
      min_num_of_version_supported: 3,
    });

    assert.throws(() =>
      getApiVersionInfo({ manifestFile, policyFile, now: NOW }),
    );
  });

  test('does not use the cache when an explicit manifest/policy override is passed', () => {
    const versions = [entry(1, 1)];
    const { manifestFile, policyFile } = writeFixture(versions, {
      min_days_supported: 30,
      min_num_of_version_supported: 1,
    });

    const cachedDefault = getApiVersionInfo();
    const overridden = getApiVersionInfo({
      manifestFile,
      policyFile,
      now: NOW,
    });

    assert.equal(overridden.minSupportedVersion, 1);
    assert.notStrictEqual(overridden, cachedDefault);
  });
});
