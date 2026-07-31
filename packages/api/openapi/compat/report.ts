import type { CompatReport, VersionCheckResult } from './types';

function formatChange(change: VersionCheckResult['changes'][number]): string {
  const location = change.path
    ? `${change.operation ?? ''} ${change.path}`.trim()
    : '';
  return `    - [${change.id}]${location ? ` ${location}:` : ''} ${change.text}`;
}

function formatDeprecated(report: CompatReport): string[] {
  if (report.skippedDeprecated.length === 0) return [];
  const floorEntry = report.skippedDeprecated[0];
  return [
    '',
    `Skipped ${report.skippedDeprecated.length} deprecated version(s) (not enforced, floor set at ${floorEntry.file}):`,
    ...report.skippedDeprecated.map((entry) =>
      entry.deprecatedAt
        ? `  - ${entry.file}: deprecated ${entry.deprecatedAt} — ${entry.deprecationReason}`
        : `  - ${entry.file}: deprecated (cascade, versions ≤ ${floorEntry.file} are retired)`,
    ),
  ];
}

export function formatHumanSummary(report: CompatReport): string {
  const lines: string[] = [];

  if (!report.brokenAt) {
    lines.push(
      `All checked versions are compatible (${report.checked.length} version(s) checked).`,
    );
    for (const result of report.checked) {
      lines.push(`  - ${result.entry.file}: OK`);
    }
    lines.push(...formatDeprecated(report));
    return lines.join('\n');
  }

  lines.push(
    `Breaking change detected against ${report.brokenAt.entry.file} (${report.checked.length} version(s) checked before stopping).`,
  );
  for (const result of report.checked) {
    if (!result.breaking) {
      lines.push(`  - ${result.entry.file}: OK`);
      continue;
    }
    lines.push(`  - ${result.entry.file}: BROKEN`);
    for (const change of result.changes) {
      lines.push(formatChange(change));
    }
  }
  lines.push(...formatDeprecated(report));

  return lines.join('\n');
}

export function toJsonReport(report: CompatReport): string {
  return JSON.stringify(report, null, 2);
}
