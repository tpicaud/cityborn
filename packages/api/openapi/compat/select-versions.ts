import type { CompatPolicy, ManifestEntry } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function deprecationFloor(
  versions: ManifestEntry[],
): number | undefined {
  const markedVersionNumbers = versions
    .filter((entry) => entry.deprecatedAt !== undefined)
    .map((entry) => entry.versionNumber);
  return markedVersionNumbers.length > 0
    ? Math.max(...markedVersionNumbers)
    : undefined;
}

export function isDeprecated(
  entry: ManifestEntry,
  floor: number | undefined,
): boolean {
  return floor !== undefined && entry.versionNumber <= floor;
}

export function selectVersionsToCheck(
  versions: ManifestEntry[],
  policy: CompatPolicy,
  now: Date,
): ManifestEntry[] {
  const floor = deprecationFloor(versions);
  const active = versions.filter((entry) => !isDeprecated(entry, floor));
  const sortedDesc = [...active].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );

  const cutoff = now.getTime() - policy.min_days_supported * DAY_MS;
  const withinWindow = sortedDesc.filter(
    (entry) => new Date(entry.releasedAt).getTime() >= cutoff,
  );

  const mostRecent = sortedDesc.slice(0, policy.min_num_of_version_supported);

  const seen = new Set<string>();
  const union: ManifestEntry[] = [];
  for (const entry of [...withinWindow, ...mostRecent]) {
    if (seen.has(entry.file)) continue;
    seen.add(entry.file);
    union.push(entry);
  }

  return union.sort((a, b) => b.versionNumber - a.versionNumber);
}
