import { spawnSync } from 'node:child_process';
import type { OasdiffChange } from './types';

const INSTALL_HINT =
  'oasdiff CLI not found on PATH.\n' +
  'Install it with: curl -fsSL https://raw.githubusercontent.com/oasdiff/oasdiff/main/install.sh | sh\n' +
  '(or "brew install oasdiff"). See https://oasdiff.com/docs for other options.';

export class OasdiffNotFoundError extends Error {
  constructor() {
    super(INSTALL_HINT);
    this.name = 'OasdiffNotFoundError';
  }
}

export function assertOasdiffAvailable(): void {
  const probe = spawnSync('oasdiff', ['--version'], { encoding: 'utf-8' });
  if (probe.error || probe.status !== 0) {
    throw new OasdiffNotFoundError();
  }
}

export interface DiffResult {
  breaking: boolean;
  changes: OasdiffChange[];
}

export function diffBreaking(
  baseFile: string,
  revisionFile: string,
): DiffResult {
  const result = spawnSync(
    'oasdiff',
    [
      'breaking',
      '--format',
      'json',
      '--fail-on',
      'ERR',
      baseFile,
      revisionFile,
    ],
    { encoding: 'utf-8' },
  );

  if (result.error) {
    throw new OasdiffNotFoundError();
  }

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `oasdiff failed (exit ${result.status}) on ${baseFile} vs ${revisionFile}:\n${result.stderr}`,
    );
  }

  const stdout = result.stdout.trim();
  const changes = stdout ? (JSON.parse(stdout) as OasdiffChange[]) : [];
  return { breaking: result.status === 1, changes };
}
