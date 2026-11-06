import { appendFileSync } from 'node:fs';

const [command, ...args]: string[] = process.argv.slice(
  2,
  process.argv.indexOf('--log'),
);
const failure: string | undefined = process.argv.includes('--fail')
  ? process.argv.at(-1)
  : undefined;
const logFile: string | undefined =
  process.argv[process.argv.indexOf('--log') + 1];
if (!logFile) throw new Error('Missing test command log.');
appendFileSync(
  logFile,
  `${JSON.stringify({ command, args, databaseUrl: process.env.TEST_DATABASE_URL, redisUrl: process.env.TEST_REDIS_URL })}\n`,
);
if (failure && args.includes(failure)) process.exit(42);
if (args.includes('port'))
  process.stdout.write(
    args.includes('postgres') ? '127.0.0.1:15432\n' : '127.0.0.1:16379\n',
  );
