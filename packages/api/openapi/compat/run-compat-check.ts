import { readFileSync } from 'node:fs';
import { assertOasdiffAvailable, diffBreaking } from './oasdiff-runner';
import {
  deprecationFloor,
  isDeprecated,
  selectVersionsToCheck,
} from './select-versions';
import type {
  CompatPolicy,
  CompatReport,
  Manifest,
  VersionCheckResult,
} from './types';
import { CompatPolicySchema, ManifestSchema } from './types';

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

export interface RunCompatCheckOptions {
  policyFile: string;
  manifestFile: string;
  versionsDir: string;
  currentSpecFile: string;
  now?: Date;
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

  const checked: VersionCheckResult[] = [];
  let brokenAt: VersionCheckResult | undefined;

  for (const entry of toCheck) {
    const versionFile = `${options.versionsDir}/${entry.file}`;
    const { breaking, changes } = diffBreaking(
      versionFile,
      options.currentSpecFile,
    );
    const result: VersionCheckResult = { entry, breaking, changes };
    checked.push(result);

    if (breaking) {
      brokenAt = result;
      break;
    }
  }

  const floor = deprecationFloor(manifest.versions);
  const skippedDeprecated = manifest.versions
    .filter((entry) => isDeprecated(entry, floor))
    .sort((a, b) => b.versionNumber - a.versionNumber);

  return { checked, brokenAt, skippedDeprecated };
}
