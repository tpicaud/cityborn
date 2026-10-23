import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenAPIObject } from 'openapi3-ts';
import { z } from 'zod';
import {
  type Manifest,
  type ManifestEntry,
  ManifestSchema,
} from '../../src/protocol/version-manifest.schema';

const VersionDocumentSchema = z
  .object({
    info: z.object({ version: z.string() }).passthrough(),
  })
  .passthrough();

type VersionDocument = z.infer<typeof VersionDocumentSchema>;

type VersioningResult = { changed: boolean; filename?: string };

export type VersionDocumentsOptions = {
  mode: 'draft' | 'release';
  versionsDir: string;
  documents: { http: OpenAPIObject; ws: OpenAPIObject };
  now?: Date;
};

function readDocument(file: string): VersionDocument | undefined {
  return existsSync(file)
    ? VersionDocumentSchema.parse(JSON.parse(readFileSync(file, 'utf-8')))
    : undefined;
}

function normalizedDocument(document: VersionDocument | OpenAPIObject): string {
  const parsed: VersionDocument = VersionDocumentSchema.parse(document);
  return JSON.stringify({
    ...parsed,
    info: { ...parsed.info, version: 'normalized' },
  });
}

export function versionDocuments({
  mode,
  versionsDir,
  documents,
  now = new Date(),
}: VersionDocumentsOptions): VersioningResult {
  mkdirSync(versionsDir, { recursive: true });
  const manifestFile: string = join(versionsDir, 'versions-manifest.json');
  const manifest: Manifest = existsSync(manifestFile)
    ? ManifestSchema.parse(JSON.parse(readFileSync(manifestFile, 'utf-8')))
    : { versions: [] };
  const latestEntry: ManifestEntry | undefined = [...manifest.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  const updatingDraft: boolean = latestEntry?.draft === true;
  const versionNumber: number = latestEntry?.draft
    ? latestEntry.versionNumber
    : (latestEntry?.versionNumber ?? 0) + 1;
  const previousHttp: VersionDocument | undefined = latestEntry
    ? readDocument(join(versionsDir, latestEntry.file))
    : undefined;
  const previousWs: VersionDocument | undefined = latestEntry
    ? readDocument(join(versionsDir, `ws-v${latestEntry.versionNumber}.json`))
    : undefined;
  const changed: boolean =
    !previousHttp ||
    !previousWs ||
    normalizedDocument(previousHttp) !== normalizedDocument(documents.http) ||
    normalizedDocument(previousWs) !== normalizedDocument(documents.ws);

  if (!changed && !(mode === 'release' && latestEntry?.draft)) {
    return { changed: false };
  }

  const filename: string = latestEntry?.draft
    ? latestEntry.file
    : `api-v${versionNumber}.json`;
  const writeDocument = ({
    file,
    document,
  }: {
    file: string;
    document: OpenAPIObject;
  }): void => {
    writeFileSync(
      join(versionsDir, file),
      JSON.stringify(
        {
          ...document,
          info: { ...document.info, version: `v${versionNumber}` },
        },
        null,
        2,
      ),
    );
  };

  writeDocument({ file: filename, document: documents.http });
  writeDocument({ file: `ws-v${versionNumber}.json`, document: documents.ws });
  const entry: ManifestEntry = latestEntry?.draft
    ? latestEntry
    : { file: filename, versionNumber, releasedAt: now.toISOString() };
  entry.releasedAt = now.toISOString();
  if (mode === 'draft') entry.draft = true;
  if (mode === 'release') delete entry.draft;
  if (!updatingDraft) manifest.versions.push(entry);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  return { changed: true, filename };
}
