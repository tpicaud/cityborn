import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Manifest, ManifestEntry } from '../openapi/compat/types';
import { getOpenApiDocument } from '../openapi/generate-openapi';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../openapi/versions');
const manifestFile = join(outDir, 'versions-manifest.json');

mkdirSync(outDir, { recursive: true });

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg?.slice('--mode='.length);

if (mode !== 'draft' && mode !== 'release') {
  throw new Error(
    'Usage: generate-openapi-file.ts --mode=draft|release\n' +
      '  draft   upserts the pending draft version on every push to main (staging)\n' +
      '  release finalizes the pending draft version into a permanent version (prod)',
  );
}

function withNormalizedVersion(document: Record<string, unknown>) {
  const info = document.info as Record<string, unknown>;
  return { ...document, info: { ...info, version: 'normalized' } };
}

function hasDocumentChanged(
  previousDocument: Record<string, unknown> | undefined,
  nextDocument: Record<string, unknown>,
): boolean {
  return (
    !previousDocument ||
    JSON.stringify(withNormalizedVersion(previousDocument)) !==
      JSON.stringify(withNormalizedVersion(nextDocument))
  );
}

function readManifest(): Manifest {
  try {
    return JSON.parse(readFileSync(manifestFile, 'utf-8')) as Manifest;
  } catch {
    return { versions: [] };
  }
}

function readVersionDocument(filename: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(outDir, filename), 'utf-8'));
}

function writeVersionDocument(filename: string, document: unknown) {
  writeFileSync(join(outDir, filename), JSON.stringify(document, null, 2));
}

function writeManifest(manifest: Manifest) {
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
}

function findLatestEntry(manifest: Manifest): ManifestEntry | undefined {
  return [...manifest.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
}

function writeOutputs(changed: boolean, filename?: string) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  if (filename) {
    appendFileSync(process.env.GITHUB_OUTPUT, `filename=${filename}\n`);
  }
}

function skip(): never {
  console.log('No API changes detected, skipping.');
  writeOutputs(false);
  process.exit(0);
}

function insertNewVersion(
  manifest: Manifest,
  document: Record<string, unknown>,
  versionNumber: number,
  draft: boolean,
): string {
  const filename = `api-v${versionNumber}.json`;
  writeVersionDocument(filename, document);
  manifest.versions.push({
    file: filename,
    versionNumber,
    releasedAt: new Date().toISOString(),
    ...(draft ? { draft: true } : {}),
  });
  writeManifest(manifest);
  return filename;
}

const manifest = readManifest();
const latestEntry = findLatestEntry(manifest);
const isDraftAtTop = latestEntry?.draft === true;

const document = getOpenApiDocument();
const targetVersion =
  isDraftAtTop && latestEntry
    ? latestEntry.versionNumber
    : (latestEntry?.versionNumber ?? 0) + 1;
document.info.version = `v${targetVersion}`;

if (mode === 'draft') {
  if (isDraftAtTop && latestEntry) {
    const previousDocument = readVersionDocument(latestEntry.file);
    if (!hasDocumentChanged(previousDocument, document)) skip();

    writeVersionDocument(latestEntry.file, document);
    latestEntry.releasedAt = new Date().toISOString();
    writeManifest(manifest);
    console.log(`Updated draft ${latestEntry.file}`);
    writeOutputs(true, latestEntry.file);
  } else {
    const previousDocument = latestEntry
      ? readVersionDocument(latestEntry.file)
      : undefined;
    if (!hasDocumentChanged(previousDocument, document)) skip();

    const filename = insertNewVersion(manifest, document, targetVersion, true);
    console.log(`Created draft ${filename}`);
    writeOutputs(true, filename);
  }
} else {
  if (isDraftAtTop && latestEntry) {
    const previousDocument = readVersionDocument(latestEntry.file);
    if (hasDocumentChanged(previousDocument, document)) {
      writeVersionDocument(latestEntry.file, document);
    }
    latestEntry.releasedAt = new Date().toISOString();
    latestEntry.draft = undefined;
    writeManifest(manifest);
    console.log(`Released ${latestEntry.file}`);
    writeOutputs(true, latestEntry.file);
  } else {
    const previousDocument = latestEntry
      ? readVersionDocument(latestEntry.file)
      : undefined;
    if (!hasDocumentChanged(previousDocument, document)) skip();

    const filename = insertNewVersion(manifest, document, targetVersion, false);
    console.log(`Created ${filename}`);
    writeOutputs(true, filename);
  }
}
