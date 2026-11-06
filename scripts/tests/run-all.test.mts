import assert from 'node:assert/strict';
import { type SpawnSyncReturns, spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Command = {
  command: string;
  args: string[];
  databaseUrl?: string;
  redisUrl?: string;
};
type Execution = { result: SpawnSyncReturns<string>; commands: Command[] };

function execute({
  failure,
  backendOnly = false,
}: {
  failure?: string;
  backendOnly?: boolean;
} = {}): Execution {
  const directory: string = mkdtempSync(
    join(tmpdir(), 'cityborn-test-runner-'),
  );
  const commandLog: string = join(directory, 'commands.jsonl');
  const fixture: string = fileURLToPath(
    new URL('./fixtures/command.mts', import.meta.url),
  );
  const quote: (value: string) => string = (value) =>
    `'${value.replaceAll("'", "'\\''")}'`;
  try {
    ['docker', 'pnpm'].forEach((command) => {
      const path: string = join(directory, command);
      writeFileSync(
        path,
        `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(fixture)} ${quote(command)} "$@" --log ${quote(commandLog)} ${failure ? `--fail ${quote(failure)}` : ''}\n`,
      );
      chmodSync(path, 0o755);
    });
    const result: SpawnSyncReturns<string> = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./run-all.mts', import.meta.url)),
        ...(backendOnly ? ['--backend'] : []),
      ],
      {
        encoding: 'utf8',
        timeout: 15000,
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
        },
      },
    );
    const commands: Command[] = readFileSync(commandLog, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    return { result, commands };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe('test:all', {
  skip:
    process.platform === 'win32'
      ? 'Command fixtures require a POSIX shell.'
      : false,
}, () => {
  it('runs shared suites then integration and e2e sequentially with isolated endpoints', () => {
    const { result, commands }: Execution = execute();
    const suites: Command[] = commands.filter(
      (command) => command.command === 'pnpm',
    );
    const resourceCommands: Command[] = commands.filter((command) =>
      command.args.includes('-p'),
    );

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      suites.map((command) => command.args.at(-1)),
      ['test', 'test:int', 'test:e2e'],
    );
    assert.equal(
      suites[1]?.databaseUrl,
      'postgresql://cityborn_test:cityborn_test@127.0.0.1:15432/cityborn_test',
    );
    assert.equal(suites[2]?.redisUrl, 'redis://127.0.0.1:16379/0');
    const projects: Set<string | undefined> = new Set(
      resourceCommands.map(
        (command) => command.args[command.args.indexOf('-p') + 1],
      ),
    );
    assert.equal(projects.size, 1);
    assert.match([...projects][0] ?? '', /^cityborn-tests-[a-f0-9-]+$/);
    assert.deepEqual(commands.at(-1)?.args.slice(-3), [
      'down',
      '--volumes',
      '--remove-orphans',
    ]);
  });

  it('runs only backend suites when requested from the backend package', () => {
    const { result, commands }: Execution = execute({ backendOnly: true });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      commands.find((command) => command.command === 'pnpm')?.args,
      ['--dir', 'apps/backend', 'test'],
    );
  });

  it('cleans only its own project and propagates a suite failure', () => {
    const { result, commands }: Execution = execute({ failure: 'test:int' });

    assert.notEqual(result.status, 0);
    assert.equal(
      commands.some((command) => command.args.includes('test:e2e')),
      false,
    );
    assert.equal(commands.at(-1)?.args.includes('down'), true);
    assert.equal(commands.at(-1)?.args.includes('-p'), true);
  });

  it('cleans partially started resources when setup fails', () => {
    const { result, commands }: Execution = execute({ failure: 'up' });

    assert.notEqual(result.status, 0);
    assert.equal(commands.at(-1)?.args.includes('down'), true);
    assert.equal(
      commands.some((command) => command.args.includes('test:int')),
      false,
    );
  });

  it('explains an unavailable Docker daemon before running suites', () => {
    const { result, commands }: Execution = execute({ failure: 'info' });

    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Docker with Compose must be installed and running/,
    );
    assert.equal(commands.length, 1);
  });

  it('propagates failures from infrastructure-free suites without creating resources', () => {
    const { result, commands }: Execution = execute({ failure: 'test' });

    assert.notEqual(result.status, 0);
    assert.equal(
      commands.some((command) => command.args.includes('up')),
      false,
    );
  });
});
