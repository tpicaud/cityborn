import type { CompatReport, VersionCheckResult } from './types';

function formatChange(change: VersionCheckResult['changes'][number]): string {
  const location = change.path
    ? `${change.operation ?? ''} ${change.path}`.trim()
    : '';
  return `    - [${change.protocol}] [${change.id}]${location ? ` ${location}:` : ''} ${change.text}`;
}

function changeKey(change: VersionCheckResult['changes'][number]): string {
  return `${change.protocol}|${change.id}|${change.operation ?? ''}|${change.path ?? ''}`;
}

function formatNonBreaking(report: CompatReport): string[] {
  const changes: VersionCheckResult['changes'] = report.checked.flatMap(
    (result) => result.changes,
  );
  const uniqueChanges: VersionCheckResult['changes'] = changes.filter(
    (change, index) =>
      changes.findIndex(
        (candidate) => changeKey(candidate) === changeKey(change),
      ) === index,
  );
  if (uniqueChanges.length === 0) return [];

  return [
    '',
    `Non-breaking changes worth reviewing (${uniqueChanges.length}):`,
    ...uniqueChanges.map(formatChange),
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
  const lines: string[] = report.checked.flatMap((result) =>
    result.breaking
      ? [
          `  ❌ ${result.entry.file}: BROKEN`,
          ...result.changes.map(formatChange),
        ]
      : [`  ✅ ${result.entry.file}: OK`],
  );

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
