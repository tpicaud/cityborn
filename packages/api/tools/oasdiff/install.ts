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
import { fileURLToPath } from 'node:url';

const version: string = '1.26.1';
export const oasdiffBinary: string = fileURLToPath(
  new URL(
    `../../node_modules/.cache/oasdiff/${version}/${process.platform}-${process.arch}/oasdiff`,
    import.meta.url,
  ),
);
const platforms: Record<string, string> = {
  'linux-x64': 'linux_amd64',
  'linux-arm64': 'linux_arm64',
  'darwin-x64': 'darwin_all',
  'darwin-arm64': 'darwin_all',
};
const checksums: Record<string, string> = {
  linux_amd64:
    'ea0007fe536c7915785f754885d2afdb11352d6a14531950edf9d601a2baa674',
  linux_arm64:
    '423ef13ac4197b1fca948ccd6839dbaa8a666841b59466542f0332a7e95a1d66',
  darwin_all:
    'ac3f56e9b7f3c717355768bc6943b5b54461f43e5c87d1e20027e2209093d2aa',
};

export async function installOasdiff(
  binary: string = oasdiffBinary,
): Promise<void> {
  const platform: string | undefined =
    platforms[`${process.platform}-${process.arch}`];
  if (!platform)
    throw new Error('oasdiff requires Linux or macOS (x64/arm64).');
  const installed: SpawnSyncReturns<string> = spawnSync(binary, ['--version'], {
    encoding: 'utf8',
  });
  if (
    installed.status === 0 &&
    installed.stdout.trim() === `oasdiff version ${version}`
  )
    return;

  const directory: string = await mkdtemp(join(tmpdir(), 'cityborn-oasdiff-'));
  try {
    const response: Response = await fetch(
      `https://github.com/oasdiff/oasdiff/releases/download/v${version}/oasdiff_${version}_${platform}.tar.gz`,
    );
    if (!response.ok)
      throw new Error(`oasdiff download failed: ${response.status}`);
    const bytes: Buffer = Buffer.from(await response.arrayBuffer());
    if (
      createHash('sha256').update(bytes).digest('hex') !== checksums[platform]
    ) {
      throw new Error('oasdiff archive checksum mismatch');
    }
    const archive: string = join(directory, 'oasdiff.tar.gz');
    await writeFile(archive, bytes);
    execFileSync('tar', ['-xzf', archive, '-C', directory, 'oasdiff']);
    await chmod(join(directory, 'oasdiff'), 0o755);
    await mkdir(dirname(binary), { recursive: true });
    await copyFile(join(directory, 'oasdiff'), binary);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await installOasdiff();
