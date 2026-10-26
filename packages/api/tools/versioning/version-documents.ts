import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenAPIObject } from 'openapi3-ts';
import { z } from 'zod';
import {
  type Manifest,
  type ManifestEntry,
  ManifestSchema,
} from '../../src/protocol/version-manifest.schema';
import { versionDocumentFilenames } from './version-document-filenames';

const VersionDocumentSchema = z
  .object({
    info: z.object({ version: z.string() }).passthrough(),
  })
  .passthrough();

type VersionDocument = z.infer<typeof VersionDocumentSchema>;

type VersioningResult =
  | { changed: false }
  | { changed: true; versionNumber: number };

export type VersionDocumentsOptions = {
  mode: 'draft' | 'release';
  newDraft?: boolean;
  versionsDir: string;
  documents: { http: OpenAPIObject; ws: OpenAPIObject };
  now?: Date;
};

function readDocument(file: string): VersionDocument {
  return VersionDocumentSchema.parse(JSON.parse(readFileSync(file, 'utf-8')));
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
  newDraft = false,
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
  if (newDraft && mode !== 'draft')
    throw new Error('A new draft requires draft mode');
  const updatingDraft: boolean = latestEntry?.draft === true && !newDraft;
  const versionNumber: number =
    updatingDraft && latestEntry
      ? latestEntry.versionNumber
      : (latestEntry?.versionNumber ?? 0) + 1;
  const previousFilenames:
    | ReturnType<typeof versionDocumentFilenames>
    | undefined = latestEntry
    ? versionDocumentFilenames(latestEntry.versionNumber)
    : undefined;
  const previousHttp: VersionDocument | undefined = previousFilenames
    ? readDocument(join(versionsDir, previousFilenames.http))
    : undefined;
  const previousWs: VersionDocument | undefined = previousFilenames
    ? readDocument(join(versionsDir, previousFilenames.ws))
    : undefined;
  const changed: boolean =
    !previousHttp ||
    !previousWs ||
    normalizedDocument(previousHttp) !== normalizedDocument(documents.http) ||
    normalizedDocument(previousWs) !== normalizedDocument(documents.ws);

  if (!changed && !newDraft && !(mode === 'release' && latestEntry?.draft)) {
    return { changed: false };
  }

  const filenames: ReturnType<typeof versionDocumentFilenames> =
    versionDocumentFilenames(versionNumber);
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

  writeDocument({ file: filenames.http, document: documents.http });
  writeDocument({ file: filenames.ws, document: documents.ws });
  const entry: ManifestEntry =
    updatingDraft && latestEntry
      ? latestEntry
      : { versionNumber, releasedAt: now.toISOString() };
  entry.releasedAt = now.toISOString();
  if (mode === 'draft') entry.draft = true;
  if (mode === 'release') delete entry.draft;
  if (!updatingDraft) manifest.versions.push(entry);
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  return { changed: true, versionNumber };
}
