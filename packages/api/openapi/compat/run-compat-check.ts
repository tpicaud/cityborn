import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { assertOasdiffAvailable, diffBreaking } from './oasdiff-runner';
import { selectVersionsToCheck } from './select-versions';
import type {
  CompatPolicy,
  CompatReport,
  Manifest,
  VersionCheckResult,
} from './types';
import { CompatPolicySchema } from './types';

export function loadPolicy(policyFile: string): CompatPolicy {
  const raw = load(readFileSync(policyFile, 'utf-8'));
  const result = CompatPolicySchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid policy in ${policyFile}: min_days_supported and min_num_of_version_supported must be numbers.`,
    );
  }
  return result.data;
}

export function loadManifest(manifestFile: string): Manifest {
  return JSON.parse(readFileSync(manifestFile, 'utf-8')) as Manifest;
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

  return { checked, brokenAt };
}
