import { type ChildProcess, execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root: string = fileURLToPath(new URL('../..', import.meta.url));
const project: string = `cityborn-tests-${randomUUID()}`;
const composeArguments: string[] = [
  'compose',
  '-p',
  project,
  '-f',
  fileURLToPath(new URL('./compose.yml', import.meta.url)),
];
let activeChild: ChildProcess | undefined;
let interrupted: NodeJS.Signals | undefined;
let stopping: Promise<Error | undefined> | undefined;
const executeFile: (
  command: string,
  args: string[],
) => Promise<{ stdout: string; stderr: string }> = promisify(execFile);

function signalGroup({
  child,
  signal,
}: {
  child: ChildProcess;
  signal: NodeJS.Signals;
}): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH'))
      throw error;
  }
}

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.pid === undefined) return;
  if (process.platform === 'win32') {
    await executeFile('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    return;
  }
  signalGroup({ child, signal: interrupted ?? 'SIGTERM' });
  const deadline: number = Date.now() + 5000;
  async function waitForGroup(): Promise<void> {
    const { stdout }: { stdout: string } = await executeFile('ps', [
      '-eo',
      'pgid=,stat=',
    ]);
    const running: boolean = stdout
      .trim()
      .split('\n')
      .some((line) => {
        const [group, state]: string[] = line.trim().split(/\s+/);
        return group === String(child.pid) && !state?.startsWith('Z');
      });
    if (!running) return;
    if (Date.now() >= deadline) signalGroup({ child, signal: 'SIGKILL' });
    await setTimeout(25);
    await waitForGroup();
  }
  await waitForGroup();
}

function interrupt(signal: NodeJS.Signals): void {
  interrupted = signal;
  if (activeChild && !stopping)
    stopping = stopChild(activeChild).then(
      () => undefined,
      (error: unknown) =>
        error instanceof Error ? error : new Error(String(error)),
    );
}

process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);

async function run({
  command,
  args,
  env = process.env,
  capture = false,
  cleanup = false,
}: {
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
  capture?: boolean;
  cleanup?: boolean;
}): Promise<string> {
  if (interrupted && !cleanup)
    throw new Error(`Tests interrupted by ${interrupted}`);
  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(command, args, {
      cwd: root,
      env,
      detached: process.platform !== 'win32',
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    activeChild = child;
    let output: string = '';
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
      output += chunk;
    });
    child.once('error', reject);
    child.once('close', async (code, signal) => {
      try {
        const stopError: Error | undefined = await stopping;
        if (stopError) throw stopError;
        if (code === 0 && (cleanup || !interrupted)) {
          resolve(output.trim());
          return;
        }
        reject(
          new Error(
            `${command} ${args.join(' ')} failed (${signal ?? interrupted ?? code})`,
          ),
        );
      } catch (error) {
        reject(error);
      } finally {
        activeChild = undefined;
        stopping = undefined;
      }
    });
  });
}

async function main(): Promise<void> {
  const backendOnly: boolean = process.argv.includes('--backend');
  const pnpm: string = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  try {
    await run({ command: 'docker', args: ['info'], capture: true });
    await run({
      command: 'docker',
      args: ['compose', 'version'],
      capture: true,
    });
  } catch (error) {
    throw new Error(
      'Docker with Compose must be installed and running for test:all.',
      { cause: error },
    );
  }
  await run({
    command: pnpm,
    args: backendOnly ? ['--dir', 'apps/backend', 'test'] : ['test'],
  });
  try {
    await run({
      command: 'docker',
      args: [...composeArguments, 'up', '-d', '--wait', '--wait-timeout', '90'],
    });
    const databaseAddress: string = await run({
      command: 'docker',
      args: [...composeArguments, 'port', 'postgres', '5432'],
      capture: true,
    });
    const redisAddress: string = await run({
      command: 'docker',
      args: [...composeArguments, 'port', 'redis', '6379'],
      capture: true,
    });
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      TEST_DATABASE_URL: `postgresql://cityborn_test:cityborn_test@${databaseAddress}/cityborn_test`,
      TEST_REDIS_URL: `redis://${redisAddress}/0`,
    };
    await run({
      command: pnpm,
      args: ['--dir', 'apps/backend', 'test:int'],
      env,
    });
    await run({
      command: pnpm,
      args: ['--dir', 'apps/backend', 'test:e2e'],
      env,
    });
  } finally {
    await run({
      command: 'docker',
      args: [...composeArguments, 'down', '--volumes', '--remove-orphans'],
      cleanup: true,
    });
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  process.off('SIGINT', interrupt);
  process.off('SIGTERM', interrupt);
}
