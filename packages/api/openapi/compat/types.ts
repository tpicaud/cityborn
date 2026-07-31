import { z } from 'zod';

export const CompatPolicySchema = z.object({
  min_days_supported: z.number(),
  min_num_of_version_supported: z.number(),
});

export type CompatPolicy = z.infer<typeof CompatPolicySchema>;

export interface ManifestEntry {
  file: string;
  runNumber: number;
  releasedAt: string;
}

export interface Manifest {
  versions: ManifestEntry[];
}

export interface OasdiffChange {
  id: string;
  text: string;
  level: number;
  operation?: string;
  path?: string;
  source?: string;
}

export interface VersionCheckResult {
  entry: ManifestEntry;
  breaking: boolean;
  changes: OasdiffChange[];
}

export interface CompatReport {
  checked: VersionCheckResult[];
  brokenAt?: VersionCheckResult;
}
