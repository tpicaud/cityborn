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
    `Skipped ${report.skippedDeprecated.length} deprecated version(s) (not enforced, floor set at v${floorEntry.versionNumber}):`,
    ...report.skippedDeprecated.map((entry) =>
      entry.deprecatedAt
        ? `  - v${entry.versionNumber}: deprecated ${entry.deprecatedAt} — ${entry.deprecationReason}`
        : `  - v${entry.versionNumber}: deprecated (cascade, versions ≤ v${floorEntry.versionNumber} are retired)`,
    ),
  ];
}

export function formatHumanSummary(report: CompatReport): string {
  const lines: string[] = report.checked.flatMap((result) =>
    result.breaking
      ? [
          `  ❌ v${result.entry.versionNumber}: BROKEN`,
          ...result.changes.map(formatChange),
        ]
      : [`  ✅ v${result.entry.versionNumber}: OK`],
  );

  lines.push(...formatNonBreaking(report));
  lines.push(...formatDeprecated(report));
  lines.push('');
  lines.push(
    report.brokenAt
      ? `❌ Breaking change detected against v${report.brokenAt.entry.versionNumber} (${report.checked.length} version(s) checked before stopping).`
      : `✅ All checked versions are compatible (${report.checked.length} version(s) checked).`,
  );

  return lines.join('\n');
}

export function toJsonReport(report: CompatReport): string {
  return JSON.stringify(report, null, 2);
}
