import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadManifest, loadPolicy, runCompatCheck } from './run-compat-check';
import type { CompatPolicy, ManifestEntry } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '__fixtures__');

function oasdiffAvailable(): boolean {
  return spawnSync('oasdiff', ['--version']).status === 0;
}

function writePolicyFile(dir: string, policy: CompatPolicy): string {
  const file = join(dir, 'policy.json');
  writeFileSync(file, JSON.stringify(policy));
  return file;
}

interface VersionSource {
  versionNumber: number;
  releasedAt: string;
  fixtureBaseFile: string;
  deprecatedAt?: string;
  deprecationReason?: string;
}

function setupVersions(dir: string, sources: VersionSource[]): string {
  const versions: ManifestEntry[] = sources.map((source) => {
    const file = `api-v${source.versionNumber}.json`;
    copyFileSync(join(fixturesDir, source.fixtureBaseFile), join(dir, file));
    return {
      file,
      versionNumber: source.versionNumber,
      releasedAt: source.releasedAt,
      ...(source.deprecatedAt
        ? {
            deprecatedAt: source.deprecatedAt,
            deprecationReason: source.deprecationReason,
          }
        : {}),
    };
  });
  const manifestFile = join(dir, 'manifest.json');
  writeFileSync(manifestFile, JSON.stringify({ versions }));
  return manifestFile;
}

describe('runCompatCheck', {
  skip:
    !oasdiffAvailable() &&
    'oasdiff CLI not found on PATH — see https://oasdiff.com/docs to install it',
}, () => {
  const now = new Date('2026-07-29T00:00:00.000Z');

  test('stops at the first breaking version and does not check older ones', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-'));
    const policyFile = writePolicyFile(dir, {
      min_days_supported: 3650,
      min_num_of_version_supported: 3,
    });
    const manifestFile = setupVersions(dir, [
      {
        versionNumber: 3,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/base.json',
      },
      {
        versionNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
      {
        versionNumber: 1,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
    ]);

    const report = runCompatCheck({
      policyFile,
      manifestFile,
      versionsDir: dir,
      currentSpecFile: join(fixturesDir, 'field-removed/revision.json'),
      now,
    });

    assert.equal(report.checked.length, 1);
    assert.equal(report.checked[0].entry.versionNumber, 3);
    assert.equal(report.checked[0].breaking, true);
    assert.equal(report.brokenAt?.entry.versionNumber, 3);
  });

  test('checks every supported version when none are breaking', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-'));
    const policyFile = writePolicyFile(dir, {
      min_days_supported: 3650,
      min_num_of_version_supported: 2,
    });
    const manifestFile = setupVersions(dir, [
      {
        versionNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
      {
        versionNumber: 1,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
    ]);

    const report = runCompatCheck({
      policyFile,
      manifestFile,
      versionsDir: dir,
      currentSpecFile: join(fixturesDir, 'no-breaking-change/revision.json'),
      now,
    });

    assert.equal(report.checked.length, 2);
    assert.ok(report.checked.every((result) => !result.breaking));
    assert.equal(report.brokenAt, undefined);
  });

  test('does not check a deprecated version even when it would break', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-'));
    const policyFile = writePolicyFile(dir, {
      min_days_supported: 3650,
      min_num_of_version_supported: 3,
    });
    const manifestFile = setupVersions(dir, [
      {
        versionNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/revision.json',
      },
      {
        versionNumber: 1,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/base.json',
        deprecatedAt: now.toISOString(),
        deprecationReason: 'test',
      },
    ]);

    const report = runCompatCheck({
      policyFile,
      manifestFile,
      versionsDir: dir,
      currentSpecFile: join(fixturesDir, 'field-removed/revision.json'),
      now,
    });

    assert.equal(report.brokenAt, undefined);
    assert.equal(report.checked.length, 1);
    assert.equal(report.checked[0].entry.versionNumber, 2);
    assert.deepEqual(
      report.skippedDeprecated.map((e) => e.file),
      ['api-v1.json'],
    );
  });

  test('cascades a deprecation to older versions that have no marker of their own', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-'));
    const policyFile = writePolicyFile(dir, {
      min_days_supported: 3650,
      min_num_of_version_supported: 3,
    });
    const manifestFile = setupVersions(dir, [
      {
        versionNumber: 3,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/revision.json',
      },
      {
        versionNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/base.json',
        deprecatedAt: now.toISOString(),
        deprecationReason: 'test',
      },
      {
        versionNumber: 1,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/base.json',
      },
    ]);

    const report = runCompatCheck({
      policyFile,
      manifestFile,
      versionsDir: dir,
      currentSpecFile: join(fixturesDir, 'no-breaking-change/revision.json'),
      now,
    });

    assert.equal(report.brokenAt, undefined);
    assert.equal(report.checked.length, 1);
    assert.equal(report.checked[0].entry.versionNumber, 3);
    assert.deepEqual(
      report.skippedDeprecated.map((e) => e.file),
      ['api-v2.json', 'api-v1.json'],
    );
  });
});

describe('loadPolicy', () => {
  test('throws when a required field is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-policy-'));
    const file = join(dir, 'policy.json');
    writeFileSync(file, JSON.stringify({ min_days_supported: 30 }));

    assert.throws(() => loadPolicy(file));
  });

  test('throws when a field has the wrong type', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-policy-'));
    const file = join(dir, 'policy.json');
    writeFileSync(
      file,
      JSON.stringify({
        min_days_supported: 'thirty',
        min_num_of_version_supported: 3,
      }),
    );

    assert.throws(() => loadPolicy(file));
  });
});

describe('loadManifest', () => {
  function writeManifestFile(dir: string, versions: unknown[]): string {
    const file = join(dir, 'manifest.json');
    writeFileSync(file, JSON.stringify({ versions }));
    return file;
  }

  test('round-trips an entry with deprecatedAt and deprecationReason', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-manifest-'));
    const file = writeManifestFile(dir, [
      {
        file: 'api-v1.json',
        versionNumber: 1,
        releasedAt: '2026-01-01T00:00:00.000Z',
        deprecatedAt: '2026-02-01T00:00:00.000Z',
        deprecationReason: 'no more traffic',
      },
    ]);

    const manifest = loadManifest(file);

    assert.equal(manifest.versions[0].deprecatedAt, '2026-02-01T00:00:00.000Z');
    assert.equal(manifest.versions[0].deprecationReason, 'no more traffic');
  });

  test('throws when deprecatedAt is set without deprecationReason', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-manifest-'));
    const file = writeManifestFile(dir, [
      {
        file: 'api-v1.json',
        versionNumber: 1,
        releasedAt: '2026-01-01T00:00:00.000Z',
        deprecatedAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    assert.throws(() => loadManifest(file));
  });

  test('throws on an unknown field (e.g. a typo in deprecatedAt)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-manifest-'));
    const file = writeManifestFile(dir, [
      {
        file: 'api-v1.json',
        versionNumber: 1,
        releasedAt: '2026-01-01T00:00:00.000Z',
        depracatedAt: '2026-02-01T00:00:00.000Z',
      },
    ]);

    assert.throws(() => loadManifest(file));
  });
});
