import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compatExitCode } from './exit-code';
import type { CompatReport } from './types';

describe('compatExitCode', () => {
  it('returns one for a report with a blocking change', () => {
    const brokenResult: CompatReport['checked'][number] = {
      entry: { versionNumber: 1, releasedAt: '2026-10-01T00:00:00.000Z' },
      breaking: true,
      changes: [],
    };
    const report: CompatReport = {
      checked: [brokenResult],
      brokenAt: brokenResult,
      skippedDeprecated: [],
    };

    const exitCode: 0 | 1 = compatExitCode(report);

    assert.equal(exitCode, 1);
  });

  it('returns zero for a compatible report', () => {
    const report: CompatReport = { checked: [], skippedDeprecated: [] };

    const exitCode: 0 | 1 = compatExitCode(report);

    assert.equal(exitCode, 0);
  });
});
