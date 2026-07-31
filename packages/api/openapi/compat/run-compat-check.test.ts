import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadPolicy, runCompatCheck } from './run-compat-check';
import type { CompatPolicy, ManifestEntry } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '__fixtures__');

function oasdiffAvailable(): boolean {
  return spawnSync('oasdiff', ['--version']).status === 0;
}

function writePolicyFile(dir: string, policy: CompatPolicy): string {
  const file = join(dir, 'policy.yaml');
  writeFileSync(
    file,
    `min_days_supported: ${policy.min_days_supported}\nmin_num_of_version_supported: ${policy.min_num_of_version_supported}\n`,
  );
  return file;
}

interface VersionSource {
  runNumber: number;
  releasedAt: string;
  fixtureBaseFile: string;
}

function setupVersions(dir: string, sources: VersionSource[]): string {
  const versions: ManifestEntry[] = sources.map((source) => {
    const file = `api-v${source.runNumber}.json`;
    copyFileSync(join(fixturesDir, source.fixtureBaseFile), join(dir, file));
    return { file, runNumber: source.runNumber, releasedAt: source.releasedAt };
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
        runNumber: 3,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'field-removed/base.json',
      },
      {
        runNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
      {
        runNumber: 1,
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
    assert.equal(report.checked[0].entry.runNumber, 3);
    assert.equal(report.checked[0].breaking, true);
    assert.equal(report.brokenAt?.entry.runNumber, 3);
  });

  test('checks every supported version when none are breaking', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-'));
    const policyFile = writePolicyFile(dir, {
      min_days_supported: 3650,
      min_num_of_version_supported: 2,
    });
    const manifestFile = setupVersions(dir, [
      {
        runNumber: 2,
        releasedAt: now.toISOString(),
        fixtureBaseFile: 'no-breaking-change/base.json',
      },
      {
        runNumber: 1,
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
});

describe('loadPolicy', () => {
  test('throws when a required field is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-policy-'));
    const file = join(dir, 'policy.yaml');
    writeFileSync(file, 'min_days_supported: 30\n');

    assert.throws(() => loadPolicy(file));
  });

  test('throws when a field has the wrong type', () => {
    const dir = mkdtempSync(join(tmpdir(), 'run-compat-check-policy-'));
    const file = join(dir, 'policy.yaml');
    writeFileSync(
      file,
      'min_days_supported: "thirty"\nmin_num_of_version_supported: 3\n',
    );

    assert.throws(() => loadPolicy(file));
  });
});
