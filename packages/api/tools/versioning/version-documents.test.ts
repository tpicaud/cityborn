import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import type { OpenAPIObject } from 'openapi3-ts';
import { ManifestSchema } from '../../src/protocol/version-manifest.schema';
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

function readManifest(directory: string) {
  return ManifestSchema.parse(
    JSON.parse(
      readFileSync(join(directory, 'versions-manifest.json'), 'utf-8'),
    ),
  );
}

const documents: Documents = { http: document('HTTP'), ws: document('WS') };

describe('versionDocuments', () => {
  it('bootstraps WS on the current draft without adding manifest fields or changing HTTP', (t) => {
    const versionsDir: string = workspace(t);
    const http: OpenAPIObject = {
      ...documents.http,
      info: { ...documents.http.info, version: 'v6' },
    };
    writeFileSync(
      join(versionsDir, 'api-v6.json'),
      JSON.stringify(http, null, 2),
    );
    writeFileSync(
      join(versionsDir, 'versions-manifest.json'),
      JSON.stringify({
        versions: [
          {
            file: 'api-v6.json',
            versionNumber: 6,
            releasedAt: '2026-01-01T00:00:00.000Z',
            draft: true,
          },
        ],
      }),
    );

    const result: VersioningResult = versionDocuments({
      mode: 'draft',
      versionsDir,
      documents,
    });

    assert.deepEqual(result, { changed: true, filename: 'api-v6.json' });
    assert.equal(readManifest(versionsDir).versions.length, 1);
    assert.equal(
      readFileSync(join(versionsDir, 'api-v6.json'), 'utf-8'),
      JSON.stringify(http, null, 2),
    );
    assert.match(
      readFileSync(join(versionsDir, 'ws-v6.json'), 'utf-8'),
      /"version": "v6"/,
    );
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

    assert.deepEqual(result, { changed: true, filename: 'api-v1.json' });
    assert.equal(readManifest(versionsDir).versions.length, 1);
    assert.match(
      readFileSync(join(versionsDir, 'ws-v1.json'), 'utf-8'),
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

    assert.equal(result.filename, 'api-v1.json');
    assert.equal(readManifest(versionsDir).versions[0].draft, undefined);
    assert.match(
      readFileSync(join(versionsDir, 'ws-v1.json'), 'utf-8'),
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

  const protocols: (keyof Documents)[] = ['http', 'ws'];
  protocols.forEach((protocol) => {
    it(`creates a shared version on a ${protocol}-only change after release`, (t) => {
      const versionsDir: string = workspace(t);
      versionDocuments({ mode: 'release', versionsDir, documents });
      const previousHttp: string = readFileSync(
        join(versionsDir, 'api-v1.json'),
        'utf-8',
      );
      const previousWs: string = readFileSync(
        join(versionsDir, 'ws-v1.json'),
        'utf-8',
      );

      const result: VersioningResult = versionDocuments({
        mode: 'draft',
        versionsDir,
        documents: { ...documents, [protocol]: document('Changed') },
      });

      assert.equal(result.filename, 'api-v2.json');
      assert.deepEqual(
        readManifest(versionsDir).versions.map((entry) => entry.versionNumber),
        [1, 2],
      );
      assert.equal(
        readFileSync(join(versionsDir, 'api-v1.json'), 'utf-8'),
        previousHttp,
      );
      assert.equal(
        readFileSync(join(versionsDir, 'ws-v1.json'), 'utf-8'),
        previousWs,
      );
      assert.match(
        readFileSync(join(versionsDir, 'api-v2.json'), 'utf-8'),
        /"version": "v2"/,
      );
      assert.match(
        readFileSync(join(versionsDir, 'ws-v2.json'), 'utf-8'),
        /"version": "v2"/,
      );
    });
  });
});
