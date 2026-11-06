import {
  execFileSync,
  type SpawnSyncReturns,
  spawnSync,
} from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { oasdiffBinary, oasdiffVersion } from './binary';

const archives: Record<string, { suffix: string; checksum: string }> = {
  'linux-x64': {
    suffix: 'linux_amd64',
    checksum:
      'ea0007fe536c7915785f754885d2afdb11352d6a14531950edf9d601a2baa674',
  },
  'linux-arm64': {
    suffix: 'linux_arm64',
    checksum:
      '423ef13ac4197b1fca948ccd6839dbaa8a666841b59466542f0332a7e95a1d66',
  },
  'darwin-x64': {
    suffix: 'darwin_all',
    checksum:
      'ac3f56e9b7f3c717355768bc6943b5b54461f43e5c87d1e20027e2209093d2aa',
  },
  'darwin-arm64': {
    suffix: 'darwin_all',
    checksum:
      'ac3f56e9b7f3c717355768bc6943b5b54461f43e5c87d1e20027e2209093d2aa',
  },
  'win32-x64': {
    suffix: 'windows_amd64',
    checksum:
      'fa662785bce15c9720eccacb693ca6af4f2b98dd51dbda8db6ae009dfae1825a',
  },
  'win32-arm64': {
    suffix: 'windows_arm64',
    checksum:
      'ed48f1c1747635dfc7a37719f46b60044205f70816957a4546fe1ed1206b286c',
  },
};

async function install(): Promise<void> {
  const archive: { suffix: string; checksum: string } | undefined =
    archives[`${process.platform}-${process.arch}`];
  if (!archive)
    throw new Error(
      `oasdiff does not support ${process.platform}-${process.arch}`,
    );
  const installed: SpawnSyncReturns<string> = spawnSync(
    oasdiffBinary,
    ['--version'],
    { encoding: 'utf8' },
  );
  if (
    installed.status === 0 &&
    installed.stdout.trim() === `oasdiff version ${oasdiffVersion}`
  )
    return;
  const temporaryDirectory: string = await mkdtemp(
    join(tmpdir(), 'cityborn-oasdiff-'),
  );
  try {
    const response: Response = await fetch(
      `https://github.com/oasdiff/oasdiff/releases/download/v${oasdiffVersion}/oasdiff_${oasdiffVersion}_${archive.suffix}.tar.gz`,
    );
    if (!response.ok)
      throw new Error(`oasdiff download failed: ${response.status}`);
    const bytes: Buffer = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== archive.checksum) {
      throw new Error('oasdiff archive checksum mismatch');
    }
    const archivePath: string = join(temporaryDirectory, 'oasdiff.tar.gz');
    const binaryName: string =
      process.platform === 'win32' ? 'oasdiff.exe' : 'oasdiff';
    await writeFile(archivePath, bytes);
    execFileSync('tar', [
      '-xzf',
      archivePath,
      '-C',
      temporaryDirectory,
      binaryName,
    ]);
    await chmod(join(temporaryDirectory, binaryName), 0o755);
    await mkdir(dirname(oasdiffBinary), { recursive: true });
    await copyFile(join(temporaryDirectory, binaryName), oasdiffBinary);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

await install();
