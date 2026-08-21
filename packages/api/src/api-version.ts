import { selectVersionsToCheck } from '../openapi/compat/select-versions';
import { CompatPolicySchema, ManifestSchema } from '../openapi/compat/types';
import compatPolicyJson from '../openapi/compat-policy.json';
import manifestJson from '../openapi/versions/versions-manifest.json';

export interface ApiVersionInfo {
  minSupportedVersion: number;
}

export function getApiVersionInfo(now: Date = new Date()): ApiVersionInfo {
  const policy = CompatPolicySchema.parse(compatPolicyJson);
  const manifest = ManifestSchema.parse(manifestJson);

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
