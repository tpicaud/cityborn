import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import type { OpenAPIObject } from 'openapi3-ts';
import {
  type Manifest,
  ManifestSchema,
} from '../../src/protocol/version-manifest.schema';
import {
  type VersionDocumentsOptions,
  versionDocuments,
} from './version-documents';

type Documents = VersionDocumentsOptions['documents'];
type VersioningResult = ReturnType<typeof versionDocuments>;

function document(title: string): OpenAPIObject {
  return { openapi: '3.0.2', info: { title, version: '1.0.0' }, paths: {} };
}

function workspace(t: TestContext): string {
  const directory: string = mkdtempSync(join(tmpdir(), 'version-documents-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function readManifest(directory: string): Manifest {
  return ManifestSchema.parse(
    JSON.parse(
      readFileSync(join(directory, 'versions-manifest.json'), 'utf-8'),
    ),
  );
}

const documents: Documents = { http: document('HTTP'), ws: document('WS') };

describe('versionDocuments', () => {
  it('supersedes the previous draft without changing its snapshots', (t) => {
    const versionsDir: string = workspace(t);
    versionDocuments({ mode: 'draft', versionsDir, documents });
    const previousManifest: Manifest = readManifest(versionsDir);
    const supersededAt: string = '2026-10-26T07:47:20.697Z';
    const previousHttp: string = readFileSync(
      join(versionsDir, 'v1-api.json'),
      'utf-8',
    );
    const previousWs: string = readFileSync(
      join(versionsDir, 'v1-ws.json'),
      'utf-8',
    );

    const result: VersioningResult = versionDocuments({
      mode: 'draft',
      newDraft: true,
      versionsDir,
      documents,
      now: new Date(supersededAt),
    });
    const repeated: VersioningResult = versionDocuments({
      mode: 'draft',
      versionsDir,
      documents,
    });

    assert.deepEqual(result, { changed: true, versionNumber: 2 });
    assert.deepEqual(repeated, { changed: false });
    assert.deepEqual(readManifest(versionsDir).versions[0], {
      versionNumber: 1,
      releasedAt: previousManifest.versions[0].releasedAt,
      supersededAt,
    });
    assert.equal(readManifest(versionsDir).versions[1].draft, true);
    assert.equal(
      readFileSync(join(versionsDir, 'v1-api.json'), 'utf-8'),
      previousHttp,
    );
    assert.equal(
      readFileSync(join(versionsDir, 'v1-ws.json'), 'utf-8'),
      previousWs,
    );
    assert.match(
      readFileSync(join(versionsDir, 'v2-api.json'), 'utf-8'),
      /"version": "v2"/,
    );
    assert.match(
      readFileSync(join(versionsDir, 'v2-ws.json'), 'utf-8'),
      /"version": "v2"/,
    );

    const released: VersioningResult = versionDocuments({
      mode: 'release',
      versionsDir,
      documents,
    });
    assert.deepEqual(released, { changed: true, versionNumber: 2 });
    assert.deepEqual(readManifest(versionsDir).versions[0], {
      versionNumber: 1,
      releasedAt: previousManifest.versions[0].releasedAt,
      supersededAt,
    });
    assert.equal(readManifest(versionsDir).versions[1].draft, undefined);
  });

  it('rejects reserving a new draft in release mode', (t) => {
    const versionsDir: string = workspace(t);

    assert.throws(
      () =>
        versionDocuments({
          mode: 'release',
          newDraft: true,
          versionsDir,
          documents,
        }),
      /requires draft mode/,
    );
  });

  it('creates both protocol snapshots and a common manifest entry', (t) => {
    const versionsDir: string = workspace(t);

    const result: VersioningResult = versionDocuments({
      mode: 'draft',
      versionsDir,
      documents,
      now: new Date('2026-10-24T12:00:00.000Z'),
    });

    assert.deepEqual(result, { changed: true, versionNumber: 1 });
    assert.deepEqual(readdirSync(versionsDir).sort(), [
      'v1-api.json',
      'v1-ws.json',
      'versions-manifest.json',
    ]);
    assert.deepEqual(readManifest(versionsDir), {
      versions: [
        {
          versionNumber: 1,
          releasedAt: '2026-10-24T12:00:00.000Z',
          draft: true,
        },
      ],
    });
  });

  const protocols: (keyof Documents)[] = ['http', 'ws'];
  const filenames: string[] = ['v1-api.json', 'v1-ws.json'];
  filenames.forEach((filename) => {
    it(`rejects a missing ${filename} for an existing version`, (t) => {
      const versionsDir: string = workspace(t);
      versionDocuments({ mode: 'draft', versionsDir, documents });
      unlinkSync(join(versionsDir, filename));

      assert.throws(
        () => versionDocuments({ mode: 'draft', versionsDir, documents }),
        { code: 'ENOENT', path: join(versionsDir, filename) },
      );
    });
  });

  it('skips unchanged documents even when their info version differs', (t) => {
    const versionsDir: string = workspace(t);
    versionDocuments({ mode: 'draft', versionsDir, documents });
    const before: string = readFileSync(
      join(versionsDir, 'versions-manifest.json'),
      'utf-8',
    );

    const result: VersioningResult = versionDocuments({
      mode: 'draft',
      versionsDir,
      documents,
    });

    assert.deepEqual(result, { changed: false });
    assert.equal(
      readFileSync(join(versionsDir, 'versions-manifest.json'), 'utf-8'),
      before,
    );
  });

  it('updates the existing draft on a WS-only change', (t) => {
    const versionsDir: string = workspace(t);
    versionDocuments({ mode: 'draft', versionsDir, documents });
    const nextDocuments: Documents = { ...documents, ws: document('New WS') };

    const result: VersioningResult = versionDocuments({
      mode: 'draft',
      versionsDir,
      documents: nextDocuments,
    });

    assert.deepEqual(result, { changed: true, versionNumber: 1 });
    assert.equal(readManifest(versionsDir).versions.length, 1);
    assert.match(
      readFileSync(join(versionsDir, 'v1-ws.json'), 'utf-8'),
      /New WS/,
    );
  });

  it('releases the draft and captures changes made since its last generation', (t) => {
    const versionsDir: string = workspace(t);
    versionDocuments({ mode: 'draft', versionsDir, documents });

    const result: VersioningResult = versionDocuments({
      mode: 'release',
      versionsDir,
      documents: { ...documents, ws: document('Release WS') },
    });

    assert.deepEqual(result, { changed: true, versionNumber: 1 });
    assert.equal(readManifest(versionsDir).versions[0].draft, undefined);
    assert.match(
      readFileSync(join(versionsDir, 'v1-ws.json'), 'utf-8'),
      /Release WS/,
    );
  });

  it('finalizes an unchanged draft and then skips an unchanged release', (t) => {
    const versionsDir: string = workspace(t);
    versionDocuments({ mode: 'draft', versionsDir, documents });

    const released: VersioningResult = versionDocuments({
      mode: 'release',
      versionsDir,
      documents,
    });
    const repeated: VersioningResult = versionDocuments({
      mode: 'release',
      versionsDir,
      documents,
    });

    assert.equal(released.changed, true);
    assert.deepEqual(repeated, { changed: false });
    assert.equal(readManifest(versionsDir).versions.length, 1);
  });

  protocols.forEach((protocol) => {
    it(`creates a shared version on a ${protocol}-only change after release`, (t) => {
      const versionsDir: string = workspace(t);
      versionDocuments({ mode: 'release', versionsDir, documents });
      const previousHttp: string = readFileSync(
        join(versionsDir, 'v1-api.json'),
        'utf-8',
      );
      const previousWs: string = readFileSync(
        join(versionsDir, 'v1-ws.json'),
        'utf-8',
      );

      const result: VersioningResult = versionDocuments({
        mode: 'draft',
        versionsDir,
        documents: { ...documents, [protocol]: document('Changed') },
      });

      assert.deepEqual(result, { changed: true, versionNumber: 2 });
      assert.deepEqual(
        readManifest(versionsDir).versions.map((entry) => entry.versionNumber),
        [1, 2],
      );
      assert.equal(
        readFileSync(join(versionsDir, 'v1-api.json'), 'utf-8'),
        previousHttp,
      );
      assert.equal(
        readFileSync(join(versionsDir, 'v1-ws.json'), 'utf-8'),
        previousWs,
      );
      assert.match(
        readFileSync(join(versionsDir, 'v2-api.json'), 'utf-8'),
        /"version": "v2"/,
      );
      assert.match(
        readFileSync(join(versionsDir, 'v2-ws.json'), 'utf-8'),
        /"version": "v2"/,
      );
    });
  });
});
