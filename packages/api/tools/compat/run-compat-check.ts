import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  deprecationFloor,
  isDeprecated,
  selectVersionsToCheck,
} from '../../src/protocol/select-versions';
import type {
  CompatPolicy,
  Manifest,
  ManifestEntry,
} from '../../src/protocol/version-manifest.schema';
import {
  CompatPolicySchema,
  ManifestSchema,
} from '../../src/protocol/version-manifest.schema';
import {
  assertOasdiffAvailable,
  type DiffResult,
  diffBreaking,
} from './oasdiff-runner';
import type { CompatReport, ProtocolChange, VersionCheckResult } from './types';

export function loadPolicy(policyFile: string): CompatPolicy {
  const raw = JSON.parse(readFileSync(policyFile, 'utf-8'));
  const result = CompatPolicySchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid policy in ${policyFile}: min_days_supported and min_num_of_version_supported must be numbers.`,
    );
  }
  return result.data;
}

export function loadManifest(manifestFile: string): Manifest {
  const raw = JSON.parse(readFileSync(manifestFile, 'utf-8'));
  const result = ManifestSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid manifest in ${manifestFile}: ${result.error.issues[0]?.path.join('.')} ${result.error.issues[0]?.message}`,
    );
  }
  return result.data;
}

export type RunCompatCheckOptions = {
  policyFile: string;
  manifestFile: string;
  versionsDir: string;
  currentSpecFile: string;
  currentWsSpecFile: string;
  errIgnoreFile?: string;
  now?: Date;
};

function checkUntilBreaking({
  entries,
  options,
}: {
  entries: ManifestEntry[];
  options: RunCompatCheckOptions;
}): VersionCheckResult[] {
  const [entry, ...remainingEntries] = entries;
  if (entry === undefined) return [];

  const http: DiffResult = diffBreaking({
    baseFile: join(options.versionsDir, entry.file),
    revisionFile: options.currentSpecFile,
    errIgnoreFile: options.errIgnoreFile,
  });
  const wsFile: string = join(
    options.versionsDir,
    `v${entry.versionNumber}-ws.json`,
  );
  const ws: DiffResult = diffBreaking({
    baseFile: wsFile,
    revisionFile: options.currentWsSpecFile,
    errIgnoreFile: options.errIgnoreFile,
  });
  const result: VersionCheckResult = {
    entry,
    breaking: http.breaking || ws.breaking,
    changes: [
      ...http.changes.map(
        (change): ProtocolChange => ({ ...change, protocol: 'HTTP' }),
      ),
      ...ws.changes.map(
        (change): ProtocolChange => ({ ...change, protocol: 'WS' }),
      ),
    ],
  };
  if (result.breaking) return [result];
  return [
    result,
    ...checkUntilBreaking({ entries: remainingEntries, options }),
  ];
}

export function runCompatCheck(options: RunCompatCheckOptions): CompatReport {
  assertOasdiffAvailable();

  const policy = loadPolicy(options.policyFile);
  const manifest = loadManifest(options.manifestFile);
  const toCheck = selectVersionsToCheck(
    manifest.versions,
    policy,
    options.now ?? new Date(),
  );

  const checked: VersionCheckResult[] = checkUntilBreaking({
    entries: toCheck,
    options,
  });
  const brokenAt: VersionCheckResult | undefined = checked.find(
    (result) => result.breaking,
  );

  const floor = deprecationFloor(manifest.versions);
  const skippedDeprecated = manifest.versions
    .filter((entry) => isDeprecated(entry, floor))
    .sort((a, b) => b.versionNumber - a.versionNumber);

  return { checked, brokenAt, skippedDeprecated };
}
