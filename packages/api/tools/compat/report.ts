import type { CompatReport, VersionCheckResult } from './types';

function formatChange(change: VersionCheckResult['changes'][number]): string {
  const location = change.path
    ? `${change.operation ?? ''} ${change.path}`.trim()
    : '';
  return `    - [${change.id}]${location ? ` ${location}:` : ''} ${change.text}`;
}

function formatNonBreaking(report: CompatReport): string[] {
  const uniqueChanges = new Map<
    string,
    VersionCheckResult['changes'][number]
  >();
  for (const result of report.checked) {
    for (const change of result.changes) {
      const key = `${change.id}|${change.operation ?? ''}|${change.path ?? ''}`;
      if (!uniqueChanges.has(key)) uniqueChanges.set(key, change);
    }
  }
  if (uniqueChanges.size === 0) return [];

  return [
    '',
    `Non-breaking changes worth reviewing (${uniqueChanges.size}):`,
    ...[...uniqueChanges.values()].map(formatChange),
  ];
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

  for (const result of report.checked) {
    if (result.breaking) {
      lines.push(`  ❌ ${result.entry.file}: BROKEN`);
      for (const change of result.changes) {
        lines.push(formatChange(change));
      }
    } else {
      lines.push(`  ✅ ${result.entry.file}: OK`);
    }
  }

  lines.push(...formatNonBreaking(report));
  lines.push(...formatDeprecated(report));

  lines.push('');
  lines.push(
    report.brokenAt
      ? `❌ Breaking change detected against ${report.brokenAt.entry.file} (${report.checked.length} version(s) checked before stopping).`
      : `✅ All checked versions are compatible (${report.checked.length} version(s) checked).`,
  );

  return lines.join('\n');
}

export function toJsonReport(report: CompatReport): string {
  return JSON.stringify(report, null, 2);
}
