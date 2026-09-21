import type { ManifestEntry } from '../../src/protocol/version-manifest.schema';

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
  skippedDeprecated: ManifestEntry[];
}
