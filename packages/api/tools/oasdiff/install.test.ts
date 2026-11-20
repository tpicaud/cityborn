import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  type Mock,
  mock,
} from 'node:test';
import { installOasdiff } from './install';

describe('installOasdiff', () => {
  let directory: string;
  let binary: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'cityborn-oasdiff-test-'));
    binary = join(directory, 'oasdiff');
  });
  afterEach(async () => {
    mock.restoreAll();
    await rm(directory, { recursive: true, force: true });
  });

  it('reuses the pinned executable without downloading', async () => {
    await writeFile(binary, '#!/bin/sh\necho "oasdiff version 1.26.1"\n', {
      mode: 0o755,
    });
    const download: Mock<typeof fetch> = mock.method(globalThis, 'fetch');

    await installOasdiff(binary);

    assert.equal(download.mock.callCount(), 0);
  });

  it('rejects a download whose checksum differs from the pin', async () => {
    mock.method(
      globalThis,
      'fetch',
      async () => new Response('invalid archive'),
    );

    await assert.rejects(
      installOasdiff(binary),
      /oasdiff archive checksum mismatch/,
    );
  });
});
