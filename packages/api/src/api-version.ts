import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest, loadPolicy } from '../openapi/compat/run-compat-check';
import { selectVersionsToCheck } from '../openapi/compat/select-versions';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiDir = join(__dirname, '../openapi');

export interface ApiVersionInfo {
  minSupportedVersion: number;
}

export interface GetApiVersionInfoOptions {
  policyFile?: string;
  manifestFile?: string;
  now?: Date;
}

let cachedApiVersionInfo: ApiVersionInfo | undefined;

export function getApiVersionInfo(
  options: GetApiVersionInfoOptions = {},
): ApiVersionInfo {
  const usesDefaultFiles = !options.policyFile && !options.manifestFile;
  if (usesDefaultFiles && cachedApiVersionInfo) {
    return cachedApiVersionInfo;
  }

  const policy = loadPolicy(
    options.policyFile ?? join(openapiDir, 'compat-policy.yaml'),
  );
  const manifest = loadManifest(
    options.manifestFile ?? join(openapiDir, 'versions/versions-manifest.json'),
  );
  const supportedVersions = selectVersionsToCheck(
    manifest.versions,
    policy,
    options.now ?? new Date(),
  );

  if (supportedVersions.length === 0) {
    throw new Error('No supported API version found in versions-manifest.json');
  }

  const info: ApiVersionInfo = {
    minSupportedVersion: Math.min(
      ...supportedVersions.map((entry) => entry.versionNumber),
    ),
  };

  if (usesDefaultFiles) {
    cachedApiVersionInfo = info;
  }

  return info;
}
