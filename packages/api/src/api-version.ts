import { selectVersionsToCheck } from '../openapi/compat/select-versions';
import {
  type CompatPolicy,
  CompatPolicySchema,
  type Manifest,
  ManifestSchema,
} from '../openapi/compat/types';
import compatPolicyJson from '../openapi/compat-policy.json';
import manifestJson from '../openapi/versions/versions-manifest.json';

export interface ApiVersionInfo {
  minSupportedVersion: number;
}

const defaultManifest = ManifestSchema.parse(manifestJson);
const defaultCompatPolicy = CompatPolicySchema.parse(compatPolicyJson);

export function getCurrentApiVersion(manifest: Manifest = defaultManifest): number {
  return Math.max(...manifest.versions.map((entry) => entry.versionNumber));
}

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
  };
}
