import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto, { type BinaryToTextEncoding, type Hash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it, type Mock, mock } from 'node:test';
import { installOasdiff } from './installation';

const checksums: Record<string, string> = {
  'linux-x64':
    'ea0007fe536c7915785f754885d2afdb11352d6a14531950edf9d601a2baa674',
  'linux-arm64':
    '423ef13ac4197b1fca948ccd6839dbaa8a666841b59466542f0332a7e95a1d66',
  'darwin-x64':
    'ac3f56e9b7f3c717355768bc6943b5b54461f43e5c87d1e20027e2209093d2aa',
  'darwin-arm64':
    'ac3f56e9b7f3c717355768bc6943b5b54461f43e5c87d1e20027e2209093d2aa',
};
const directories: string[] = [];
const originalCreateHash: typeof crypto.createHash = crypto.createHash;

function fixture(): {
  directory: string;
  binary: string;
  archive: Uint8Array<ArrayBuffer>;
  source: string;
} {
  const directory: string = mkdtempSync(
    join(tmpdir(), 'cityborn-installer-test-'),
  );
  directories.push(directory);
  const source: string = '#!/bin/sh\nprintf "oasdiff version 1.26.1\\n"\n';
  const binary: string = join(directory, 'installed', 'oasdiff');
  writeFileSync(join(directory, 'oasdiff'), source, { mode: 0o755 });
  execFileSync('tar', [
    '-czf',
    join(directory, 'archive.tar.gz'),
    '-C',
    directory,
    'oasdiff',
  ]);
  return {
    directory,
    binary,
    source,
    archive: new Uint8Array(readFileSync(join(directory, 'archive.tar.gz'))),
  };
}

function mockChecksum(checksum?: string): void {
  const hash: Hash = originalCreateHash('sha256');
  const value: string =
    checksum ?? checksums[`${process.platform}-${process.arch}`] ?? '';
  function digest(): Buffer;
  function digest(encoding: BinaryToTextEncoding): string;
  function digest(encoding?: BinaryToTextEncoding): Buffer | string {
    return encoding ? value : Buffer.from(value, 'hex');
  }
  mock.method(hash, 'digest', digest);
  mock.method(crypto, 'createHash', () => hash);
  syncBuiltinESMExports();
}

function temporaryDirectories(): string[] {
  return readdirSync(tmpdir())
    .filter((directory) => directory.startsWith('cityborn-oasdiff-'))
    .sort();
}

afterEach(() => {
  mock.restoreAll();
  syncBuiltinESMExports();
  directories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('installOasdiff', {
  skip:
    process.platform === 'win32'
      ? 'Executable fixtures require a POSIX shell.'
      : false,
}, () => {
  it('downloads the platform archive, verifies it and installs an executable without leaving temporary files', async () => {
    const { binary, archive, source }: ReturnType<typeof fixture> = fixture();
    const before: string[] = temporaryDirectories();
    const download: Mock<typeof fetch> = mock.method(
      globalThis,
      'fetch',
      async () => new Response(archive),
    );
    mockChecksum();

    await installOasdiff(binary);

    assert.match(
      String(download.mock.calls[0]?.arguments[0]),
      new RegExp(
        `oasdiff_1\\.26\\.1_${process.platform === 'darwin' ? 'darwin_all' : `linux_${process.arch === 'x64' ? 'amd64' : 'arm64'}`}\\.tar\\.gz$`,
      ),
    );
    assert.equal(readFileSync(binary, 'utf8'), source);
    assert.equal(
      execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim(),
      'oasdiff version 1.26.1',
    );
    assert.deepEqual(temporaryDirectories(), before);
  });

  it('reuses an installed executable with the pinned version without downloading', async () => {
    const { binary, source }: ReturnType<typeof fixture> = fixture();
    mkdirSync(join(binary, '..'), { recursive: true });
    writeFileSync(binary, source, { mode: 0o755 });
    const download: Mock<typeof fetch> = mock.method(
      globalThis,
      'fetch',
      async () => {
        throw new Error('Unexpected download');
      },
    );

    await installOasdiff(binary);

    assert.equal(download.mock.callCount(), 0);
    assert.equal(readFileSync(binary, 'utf8'), source);
  });

  it('replaces an executable with an incorrect version', async () => {
    const { binary, archive, source }: ReturnType<typeof fixture> = fixture();
    mkdirSync(join(binary, '..'), { recursive: true });
    writeFileSync(binary, '#!/bin/sh\nprintf "oasdiff version 0.0.0\\n"\n');
    chmodSync(binary, 0o755);
    mock.method(globalThis, 'fetch', async () => new Response(archive));
    mockChecksum();

    await installOasdiff(binary);

    assert.equal(readFileSync(binary, 'utf8'), source);
  });

  it('cleans temporary files when the server refuses the download', async () => {
    const { binary }: ReturnType<typeof fixture> = fixture();
    const before: string[] = temporaryDirectories();
    mock.method(
      globalThis,
      'fetch',
      async () => new Response('Unavailable', { status: 503 }),
    );

    await assert.rejects(
      installOasdiff(binary),
      /oasdiff download failed: 503/,
    );

    assert.equal(existsSync(binary), false);
    assert.deepEqual(temporaryDirectories(), before);
  });

  it('cleans temporary files when the download rejects', async () => {
    const { binary }: ReturnType<typeof fixture> = fixture();
    const before: string[] = temporaryDirectories();
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('Network failure');
    });

    await assert.rejects(installOasdiff(binary), /Network failure/);

    assert.equal(existsSync(binary), false);
    assert.deepEqual(temporaryDirectories(), before);
  });

  it('rejects an archive whose real checksum differs from the pin and cleans temporary files', async () => {
    const { binary, archive }: ReturnType<typeof fixture> = fixture();
    const before: string[] = temporaryDirectories();
    mock.method(globalThis, 'fetch', async () => new Response(archive));

    await assert.rejects(
      installOasdiff(binary),
      /oasdiff archive checksum mismatch/,
    );

    assert.equal(existsSync(binary), false);
    assert.deepEqual(temporaryDirectories(), before);
  });

  it('cleans temporary files when extraction fails', async () => {
    const { binary }: ReturnType<typeof fixture> = fixture();
    const before: string[] = temporaryDirectories();
    mock.method(
      globalThis,
      'fetch',
      async () => new Response('Invalid tar archive'),
    );
    mockChecksum();

    await assert.rejects(installOasdiff(binary), /Command failed: tar/);

    assert.equal(existsSync(binary), false);
    assert.deepEqual(temporaryDirectories(), before);
  });
});
