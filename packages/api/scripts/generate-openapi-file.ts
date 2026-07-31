import {
  appendFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Manifest } from '../openapi/compat/types';
import { getOpenApiDocument } from '../openapi/generate-openapi';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../openapi/versions');
const manifestFile = join(outDir, 'versions-manifest.json');

mkdirSync(outDir, { recursive: true });

const filenamePattern = /^api-v(\d+)\.json$/;

function findLatestFile(): { name: string; version: number } | undefined {
  const versionedFiles = readdirSync(outDir)
    .map((name) => ({ name, match: name.match(filenamePattern) }))
    .filter(
      (entry): entry is { name: string; match: RegExpMatchArray } =>
        entry.match !== null,
    )
    .map((entry) => ({ name: entry.name, version: Number(entry.match[1]) }))
    .sort((a, b) => b.version - a.version);

  return versionedFiles[0];
}

function withNormalizedVersion(document: Record<string, unknown>) {
  const info = document.info as Record<string, unknown>;
  return { ...document, info: { ...info, version: 'normalized' } };
}

const latestFile = findLatestFile();
const nextVersion = (latestFile?.version ?? 0) + 1;

const document = getOpenApiDocument();
document.info.version = `v${nextVersion}`;

const previousDocument = latestFile
  ? JSON.parse(readFileSync(join(outDir, latestFile.name), 'utf-8'))
  : undefined;

const hasChanged =
  !previousDocument ||
  JSON.stringify(withNormalizedVersion(previousDocument)) !==
    JSON.stringify(withNormalizedVersion(document));

if (!hasChanged) {
  console.log('No API changes detected, skipping.');
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, 'changed=false\n');
  }
  process.exit(0);
}

const filename = `api-v${nextVersion}.json`;
writeFileSync(join(outDir, filename), JSON.stringify(document, null, 2));
console.log(`Generated ${filename}`);

function readManifest(): Manifest {
  try {
    return JSON.parse(readFileSync(manifestFile, 'utf-8')) as Manifest;
  } catch {
    return { versions: [] };
  }
}

const manifest = readManifest();
manifest.versions.push({
  file: filename,
  versionNumber: nextVersion,
  releasedAt: new Date().toISOString(),
});
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `changed=true\nfilename=${filename}\n`,
  );
}
