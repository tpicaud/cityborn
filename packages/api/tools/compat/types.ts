import type { ManifestEntry } from '../../src/protocol/version-manifest.schema';

export type OasdiffChange = {
  id: string;
  text: string;
  level: number;
  operation?: string;
  path?: string;
  source?: string;
};

export type ProtocolChange = OasdiffChange & { protocol: 'HTTP' | 'WS' };

export type VersionCheckResult = {
  entry: ManifestEntry;
  breaking: boolean;
  changes: ProtocolChange[];
};

export type CompatReport = {
  checked: VersionCheckResult[];
  brokenAt?: VersionCheckResult;
  skippedDeprecated: ManifestEntry[];
};
