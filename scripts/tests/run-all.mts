import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

function interrupt(signal: NodeJS.Signals): void {
  interrupted = signal;
  activeChild?.kill(signal);
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
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    activeChild = child;
    let output: string = '';
    child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
      output += chunk;
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      activeChild = undefined;
      if (code === 0) {
        resolve(output.trim());
        return;
      }
      reject(
        new Error(`${command} ${args.join(' ')} failed (${signal ?? code})`),
      );
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
