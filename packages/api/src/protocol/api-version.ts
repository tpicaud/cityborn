import compatPolicyJson from '../../openapi/compat-policy.json';
import manifestJson from '../../openapi/versions/versions-manifest.json';
import { selectVersionsToCheck } from './select-versions';
import {
  type CompatPolicy,
  CompatPolicySchema,
  type Manifest,
  ManifestSchema,
} from './version-manifest.schema';

export const API_VERSION_HEADER_NAME: string = 'X-Api-Version';

export function parseClientApiVersion(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) return undefined;
  const version: number = Number(value);
  return Number.isSafeInteger(version) && version > 0 ? version : undefined;
}

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

const defaultManifest: Manifest = ManifestSchema.parse(manifestJson);
export const CLIENT_API_VERSION: number = Math.max(
  ...defaultManifest.versions.map((entry) => entry.versionNumber),
);
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
