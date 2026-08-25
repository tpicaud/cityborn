import { selectVersionsToCheck } from '../openapi/compat/select-versions';
import {
  type CompatPolicy,
  CompatPolicySchema,
  type Manifest,
  ManifestSchema,
} from '../openapi/compat/types';
import compatPolicyJson from '../openapi/compat-policy.json';
import manifestJson from '../openapi/versions/versions-manifest.json';

export const API_MIN_SUPPORTED_VERSION_HEADER_NAME =
  'X-Api-Min-Supported-Version';
export const API_CURRENT_VERSION_HEADER_NAME = 'X-Api-Current-Version';

export interface ApiVersionInfo {
  minSupportedVersion: number;
  currentVersion: number;
}

export function isApiVersionOutdated(
  currentVersion: number,
  minSupportedVersion: number,
): boolean {
  return currentVersion < minSupportedVersion;
}

const defaultManifest = ManifestSchema.parse(manifestJson);
const defaultCompatPolicy = CompatPolicySchema.parse(compatPolicyJson);

export function getApiVersionInfo(
  now: Date = new Date(),
  manifest: Manifest = defaultManifest,
  policy: CompatPolicy = defaultCompatPolicy,
): ApiVersionInfo {
  const supportedVersions = selectVersionsToCheck(
    manifest.versions,
    policy,
    now,
  );

  if (supportedVersions.length === 0) {
    throw new Error('No supported API version found in versions-manifest.json');
  }

  return {
    minSupportedVersion: Math.min(
      ...supportedVersions.map((entry) => entry.versionNumber),
    ),
    currentVersion: Math.max(
      ...manifest.versions.map((entry) => entry.versionNumber),
    ),
  };
}
