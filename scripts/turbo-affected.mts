import { type SpawnSyncReturns, spawnSync } from 'node:child_process';

const readGit = (args: string[]): string | undefined => {
  const result: SpawnSyncReturns<string> = spawnSync('git', args, {
    encoding: 'utf8',
  });
  const output: string = result.stdout?.trim() ?? '';
  return result.status === 0 && output !== '' ? output : undefined;
};

const resolveTargetBranchBase = (): string | undefined => {
  const currentBranch: string | undefined = readGit([
    'branch',
    '--show-current',
  ]);
  if (!currentBranch) {
    return undefined;
  }
  const targetBranch: string | undefined = readGit([
    'config',
    '--get',
    `branch.${currentBranch}.gh-merge-base`,
  ]);
  if (!targetBranch) {
    return undefined;
  }
  const targetBranchBase: string = `origin/${targetBranch}`;
  if (!readGit(['rev-parse', '--verify', '--quiet', targetBranchBase])) {
    console.warn(
      `${targetBranchBase} introuvable, comparaison à main ; lancez git fetch origin ${targetBranch}`,
    );
    return undefined;
  }
  return targetBranchBase;
};

const scmBase: string | undefined =
  process.env.TURBO_SCM_BASE ?? resolveTargetBranchBase();

const turbo: SpawnSyncReturns<Buffer> = spawnSync(
  'turbo',
  ['run', ...process.argv.slice(2), '--affected'],
  {
    stdio: 'inherit',
    env: scmBase ? { ...process.env, TURBO_SCM_BASE: scmBase } : process.env,
  },
);

if (turbo.error) {
  throw turbo.error;
}

process.exit(turbo.status ?? 1);
