import type { CompatReport, VersionCheckResult } from './types';

function formatChange(change: VersionCheckResult['changes'][number]): string {
  const location = change.path
    ? `${change.operation ?? ''} ${change.path}`.trim()
    : '';
  return `    - [${change.id}]${location ? ` ${location}:` : ''} ${change.text}`;
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

  return lines.join('\n');
}

export function toJsonReport(report: CompatReport): string {
  return JSON.stringify(report, null, 2);
}
