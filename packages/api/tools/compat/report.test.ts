import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatHumanSummary } from './report';
import type { CompatReport } from './types';

describe('formatHumanSummary', () => {
  it('identifies the common versions and their retirement floor without a protocol filename', () => {
    const report: CompatReport = {
      checked: [
        {
          entry: { versionNumber: 3, releasedAt: '2026-10-03T00:00:00.000Z' },
          breaking: false,
          changes: [],
        },
      ],
      skippedDeprecated: [
        {
          versionNumber: 2,
          releasedAt: '2026-10-02T00:00:00.000Z',
          deprecatedAt: '2026-10-23',
          deprecationReason: 'Clients have upgraded',
        },
        { versionNumber: 1, releasedAt: '2026-10-01T00:00:00.000Z' },
      ],
    };

    const summary: string = formatHumanSummary(report);

    assert.equal(
      summary,
      [
        '  ✅ v3: COMPATIBLE',
        '',
        'Skipped 2 deprecated version(s) (not enforced, floor set at v2):',
        '  - v2: deprecated 2026-10-23 — Clients have upgraded',
        '  - v1: deprecated (cascade, versions ≤ v2 are retired)',
        '',
        '✅ All checked versions are compatible (1 version(s) checked).',
      ].join('\n'),
    );
  });

  it('separates errors, warnings requiring review and accepted changes', () => {
    const brokenResult: CompatReport['checked'][number] = {
      entry: { versionNumber: 2, releasedAt: '2026-10-03T00:00:00.000Z' },
      breaking: true,
      changes: [
        {
          id: 'error-change',
          text: 'an error',
          level: 3,
          severity: 'error',
          protocol: 'HTTP',
        },
        {
          id: 'warning-change',
          text: 'a warning',
          level: 2,
          severity: 'warning',
          protocol: 'WS',
        },
        {
          id: 'accepted-change',
          text: 'an accepted warning',
          level: 2,
          severity: 'accepted',
          acceptanceReason: 'Published clients tolerate it.',
          protocol: 'HTTP',
        },
      ],
    };
    const report: CompatReport = {
      checked: [brokenResult],
      brokenAt: brokenResult,
      skippedDeprecated: [],
    };

    const summary: string = formatHumanSummary(report);

    assert.match(summary, /Errors \(1\)/);
    assert.match(summary, /Warnings requiring review \(1\)/);
    assert.match(summary, /Accepted changes \(1\)/);
    assert.match(summary, /Published clients tolerate it/);
  });
});
