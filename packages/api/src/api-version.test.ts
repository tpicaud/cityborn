import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectVersionsToCheck } from '../openapi/compat/select-versions';
import type { CompatPolicy, Manifest } from '../openapi/compat/types';
import { getApiVersionInfo } from './api-version';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiDir = join(__dirname, '../openapi');

test('returns the lowest version number still selected by selectVersionsToCheck on the real manifest/policy', () => {
  const manifest = JSON.parse(
    readFileSync(join(openapiDir, 'versions/versions-manifest.json'), 'utf-8'),
  ) as Manifest;
  const policy = JSON.parse(
    readFileSync(join(openapiDir, 'compat-policy.json'), 'utf-8'),
  ) as CompatPolicy;

  const now = new Date();
  const info = getApiVersionInfo(now);

  const expectedVersions = selectVersionsToCheck(
    manifest.versions,
    policy,
    now,
  );
  const expectedMinSupportedVersion = Math.min(
    ...expectedVersions.map((v) => v.versionNumber),
  );

  assert.equal(info.minSupportedVersion, expectedMinSupportedVersion);
});

test('defaults now to the current date when not provided', () => {
  const withExplicitNow = getApiVersionInfo(new Date());
  const withDefaultNow = getApiVersionInfo();

  assert.equal(
    withDefaultNow.minSupportedVersion,
    withExplicitNow.minSupportedVersion,
  );
});
