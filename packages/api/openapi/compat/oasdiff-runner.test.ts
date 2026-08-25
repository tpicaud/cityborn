import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { diffBreaking } from './oasdiff-runner';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '__fixtures__');

function oasdiffAvailable(): boolean {
  return spawnSync('oasdiff', ['--version']).status === 0;
}

describe('diffBreaking on fixtures', {
  skip:
    !oasdiffAvailable() &&
    "oasdiff CLI introuvable sur le PATH — voir https://oasdiff.com/docs pour l'installer",
}, () => {
  const cases: Array<[string, boolean, string]> = [
    ['field-removed', true, 'response-required-property-removed'],
    ['type-changed', true, 'response-property-type-changed'],
    ['endpoint-removed', true, 'api-path-removed-without-deprecation'],
    ['required-param-added', true, 'new-required-request-parameter'],
    ['no-breaking-change', false, ''],
  ];

  for (const [fixture, expectedBreaking, expectedId] of cases) {
    test(fixture, () => {
      const base = join(fixturesDir, fixture, 'base.json');
      const revision = join(fixturesDir, fixture, 'revision.json');
      const { breaking, changes } = diffBreaking(base, revision);

      assert.equal(breaking, expectedBreaking);
      if (expectedBreaking) {
        assert.ok(
          changes.some((change) => change.id === expectedId),
          `expected a "${expectedId}" change, got: ${JSON.stringify(changes)}`,
        );
      }
    });
  }

  test('errIgnoreFile suppresses a pinned breaking change', () => {
    const base = join(fixturesDir, 'required-param-added', 'base.json');
    const revision = join(fixturesDir, 'required-param-added', 'revision.json');

    const dir = mkdtempSync(join(tmpdir(), 'oasdiff-err-ignore-'));
    const errIgnoreFile = join(dir, 'err-ignore.txt');
    writeFileSync(
      errIgnoreFile,
      'GET /widgets added the new required `query` request parameter `token`\n',
    );

    const ignored = diffBreaking(base, revision, errIgnoreFile);
    assert.equal(ignored.breaking, false);

    const notIgnored = diffBreaking(base, revision);
    assert.equal(notIgnored.breaking, true);
  });
});
