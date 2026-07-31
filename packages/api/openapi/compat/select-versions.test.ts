import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectVersionsToCheck } from './select-versions';
import type { ManifestEntry } from './types';

const NOW = new Date('2026-07-29T00:00:00.000Z');

function entry(runNumber: number, daysAgo: number): ManifestEntry {
  const releasedAt = new Date(
    NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return { file: `api-v${runNumber}.json`, runNumber, releasedAt };
}

test('returns only the versions within the day window when they outnumber the floor', () => {
  const versions = [
    entry(5, 1),
    entry(4, 5),
    entry(3, 10),
    entry(2, 40),
    entry(1, 60),
  ];
  const result = selectVersionsToCheck(
    versions,
    { min_days_supported: 30, min_num_of_version_supported: 2 },
    NOW,
  );

  assert.deepEqual(
    result.map((v) => v.file),
    ['api-v5.json', 'api-v4.json', 'api-v3.json'],
  );
});

test('pads with the most recent versions when the day window is too narrow', () => {
  const versions = [
    entry(5, 1),
    entry(4, 45),
    entry(3, 50),
    entry(2, 60),
    entry(1, 70),
  ];
  const result = selectVersionsToCheck(
    versions,
    { min_days_supported: 30, min_num_of_version_supported: 3 },
    NOW,
  );

  assert.deepEqual(
    result.map((v) => v.file),
    ['api-v5.json', 'api-v4.json', 'api-v3.json'],
  );
});

test('applies the union when the window and the floor disagree on the set', () => {
  const versions = [
    entry(6, 1),
    entry(5, 5),
    entry(4, 10),
    entry(3, 45),
    entry(2, 50),
    entry(1, 90),
  ];
  const result = selectVersionsToCheck(
    versions,
    { min_days_supported: 30, min_num_of_version_supported: 5 },
    NOW,
  );

  assert.deepEqual(
    result.map((v) => v.file),
    ['api-v6.json', 'api-v5.json', 'api-v4.json', 'api-v3.json', 'api-v2.json'],
  );
});

test('never returns duplicates', () => {
  const versions = [entry(3, 1), entry(2, 5), entry(1, 10)];
  const result = selectVersionsToCheck(
    versions,
    { min_days_supported: 30, min_num_of_version_supported: 3 },
    NOW,
  );

  assert.equal(result.length, 3);
});
