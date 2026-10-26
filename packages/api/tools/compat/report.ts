import type { CompatReport, VersionCheckResult } from './types';

function formatChange(change: VersionCheckResult['changes'][number]): string {
  const location = change.path
    ? `${change.operation ?? ''} ${change.path}`.trim()
    : '';
  return `    - [${change.protocol}] [${change.id}]${location ? ` ${location}:` : ''} ${change.text}`;
}

type AcceptedChangeSummary = {
  protocol: VersionCheckResult['changes'][number]['protocol'];
  id: string;
  reason: string;
  count: number;
};

function formatAcceptedChanges(
  changes: VersionCheckResult['changes'],
): string[] {
  const summaries: AcceptedChangeSummary[] = changes.reduce<
    AcceptedChangeSummary[]
  >((current, change) => {
    const reason: string = change.acceptanceReason ?? 'Accepted by policy.';
    const existing: AcceptedChangeSummary | undefined = current.find(
      (summary) =>
        summary.protocol === change.protocol &&
        summary.id === change.id &&
        summary.reason === reason,
    );
    if (existing === undefined) {
      current.push({
        protocol: change.protocol,
        id: change.id,
        reason,
        count: 1,
      });
      return current;
    }
    return current.map((summary) =>
      summary === existing ? { ...summary, count: summary.count + 1 } : summary,
    );
  }, []);
  if (summaries.length === 0) return [];
  return [
    `    Accepted changes (${changes.length}):`,
    ...summaries.map(
      (summary) =>
        `      - [${summary.protocol}] [${summary.id}] ${summary.count} occurrence(s): ${summary.reason}`,
    ),
  ];
}

function formatResult(result: VersionCheckResult): string[] {
  const errors: VersionCheckResult['changes'] = result.changes.filter(
    (change) => change.severity === 'error',
  );
  const warnings: VersionCheckResult['changes'] = result.changes.filter(
    (change) => change.severity === 'warning',
  );
  const accepted: VersionCheckResult['changes'] = result.changes.filter(
    (change) => change.severity === 'accepted',
  );

  return [
    result.breaking
      ? `  ❌ v${result.entry.versionNumber}: BROKEN`
      : `  ✅ v${result.entry.versionNumber}: COMPATIBLE`,
    ...(errors.length === 0
      ? []
      : [`    Errors (${errors.length}):`, ...errors.map(formatChange)]),
    ...(warnings.length === 0
      ? []
      : [
          `    Warnings requiring review (${warnings.length}):`,
          ...warnings.map(formatChange),
        ]),
    ...formatAcceptedChanges(accepted),
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
  const lines: string[] = report.checked.flatMap(formatResult);

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
