import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [command, ...args]: string[] = process.argv.slice(
  2,
  process.argv.indexOf('--log'),
);
const failure: string | undefined = process.argv.includes('--fail')
  ? process.argv[process.argv.indexOf('--fail') + 1]
  : undefined;
const logFile: string | undefined =
  process.argv[process.argv.indexOf('--log') + 1];
if (!logFile) throw new Error('Missing test command log.');
let descendantRunning: boolean | undefined;
if (args.includes('down') && existsSync(`${logFile}.pid`)) {
  const { pid }: { pid: number } = JSON.parse(
    readFileSync(`${logFile}.pid`, 'utf8'),
  );
  const states: string = execFileSync('ps', ['-eo', 'pid=,stat='], {
    encoding: 'utf8',
  });
  descendantRunning = states.split('\n').some((line) => {
    const [processId, state]: string[] = line.trim().split(/\s+/);
    return processId === String(pid) && !state?.startsWith('Z');
  });
}
appendFileSync(
  logFile,
  `${JSON.stringify({ command, args, databaseUrl: process.env.TEST_DATABASE_URL, redisUrl: process.env.TEST_REDIS_URL, descendantRunning })}\n`,
);
if (failure && args.includes(failure)) process.exit(42);
if (
  command === 'pnpm' &&
  args.includes('test:int') &&
  process.argv.includes('--descendant')
) {
  const child: ChildProcess = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('./descendant.mts', import.meta.url)),
      `${logFile}.pid`,
      process.argv[process.argv.indexOf('--descendant') + 1] ?? '',
    ],
    { stdio: 'ignore' },
  );
  await new Promise<void>((resolve) => child.once('close', () => resolve()));
}
if (args.includes('port'))
  process.stdout.write(
    args.includes('postgres') ? '127.0.0.1:15432\n' : '127.0.0.1:16379\n',
  );
