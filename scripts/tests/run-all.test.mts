import assert from 'node:assert/strict';
import {
  type ChildProcess,
  execFileSync,
  type SpawnSyncReturns,
  spawn,
  spawnSync,
} from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

type Command = {
  command: string;
  args: string[];
  databaseUrl?: string;
  redisUrl?: string;
  descendantRunning?: boolean;
};
type Execution = { result: SpawnSyncReturns<string>; commands: Command[] };
type Fixture = {
  directory: string;
  commandLog: string;
  env: NodeJS.ProcessEnv;
  commands: () => Command[];
};

function fixture({
  failure,
  descendant,
}: {
  failure?: string;
  descendant?: string;
}): Fixture {
  const directory: string = mkdtempSync(
    join(tmpdir(), 'cityborn-test-runner-'),
  );
  const commandLog: string = join(directory, 'commands.jsonl');
  const commandFixture: string = fileURLToPath(
    new URL('./fixtures/command.mts', import.meta.url),
  );
  const quote: (value: string) => string = (value) =>
    `'${value.replaceAll("'", "'\\''")}'`;
  ['docker', 'pnpm'].forEach((command) => {
    const path: string = join(directory, command);
    writeFileSync(
      path,
      `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(commandFixture)} ${quote(command)} "$@" --log ${quote(commandLog)} ${failure ? `--fail ${quote(failure)}` : ''} ${descendant ? `--descendant ${quote(descendant)}` : ''}\n`,
    );
    chmodSync(path, 0o755);
  });
  return {
    directory,
    commandLog,
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
    commands: () =>
      readFileSync(commandLog, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line)),
  };
}

function execute({
  failure,
  backendOnly = false,
}: {
  failure?: string;
  backendOnly?: boolean;
} = {}): Execution {
  const prepared: Fixture = fixture({ failure });
  try {
    const result: SpawnSyncReturns<string> = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./run-all.mts', import.meta.url)),
        ...(backendOnly ? ['--backend'] : []),
      ],
      {
        encoding: 'utf8',
        timeout: 15000,
        env: prepared.env,
      },
    );
    const commands: Command[] = prepared.commands();
    return { result, commands };
  } finally {
    rmSync(prepared.directory, { recursive: true, force: true });
  }
}

describe('test:all', {
  skip:
    process.platform === 'win32'
      ? 'Command fixtures require a POSIX shell.'
      : false,
}, () => {
  ['delayed', 'ignore'].forEach((descendant) => {
    it(`stops a descendant with ${descendant} termination before cleaning Compose after SIGTERM`, {
      timeout: 15000,
    }, async () => {
      const prepared: Fixture = fixture({ descendant });
      const launcher: ChildProcess = spawn(
        process.execPath,
        [fileURLToPath(new URL('./run-all.mts', import.meta.url))],
        { env: prepared.env, stdio: ['ignore', 'ignore', 'pipe'] },
      );
      let stderr: string = '';
      launcher.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
        stderr += chunk;
      });
      const completion: Promise<number | null> = new Promise(
        (resolve, reject) => {
          launcher.once('error', reject);
          launcher.once('close', resolve);
        },
      );
      let suitePid: number | undefined;
      try {
        const deadline: number = Date.now() + 5000;
        async function waitForDescendant(): Promise<void> {
          if (existsSync(`${prepared.commandLog}.pid`)) return;
          assert.ok(
            Date.now() < deadline,
            stderr || 'Descendant did not start',
          );
          await setTimeout(25);
          await waitForDescendant();
        }
        await waitForDescendant();
        const processIds: { pid: number; parent: number } = JSON.parse(
          readFileSync(`${prepared.commandLog}.pid`, 'utf8'),
        );
        suitePid = processIds.parent;

        launcher.kill('SIGTERM');
        const code: number | null = await completion;

        assert.equal(code, 1, stderr);
        const commands: Command[] = prepared.commands();
        const cleanup: Command | undefined = commands.find((command) =>
          command.args.includes('down'),
        );
        assert.ok(cleanup);
        assert.equal(cleanup.descendantRunning, false);
        assert.equal(
          commands.some((command) => command.args.includes('test:e2e')),
          false,
        );
        const started: Command | undefined = commands.find((command) =>
          command.args.includes('up'),
        );
        assert.ok(started);
        assert.equal(
          cleanup.args[cleanup.args.indexOf('-p') + 1],
          started.args[started.args.indexOf('-p') + 1],
        );
        const state: string = execFileSync('ps', ['-eo', 'pid=,stat='], {
          encoding: 'utf8',
        });
        assert.equal(
          state.split('\n').some((line) => {
            const [pid, status]: string[] = line.trim().split(/\s+/);
            return pid === String(processIds.pid) && !status?.startsWith('Z');
          }),
          false,
        );
      } finally {
        if (suitePid !== undefined) {
          try {
            process.kill(-suitePid, 'SIGKILL');
          } catch (error) {
            if (
              !(
                error instanceof Error &&
                'code' in error &&
                error.code === 'ESRCH'
              )
            )
              assert.fail(String(error));
          }
        }
        if (launcher.exitCode === null) launcher.kill('SIGKILL');
        await completion;
        rmSync(prepared.directory, { recursive: true, force: true });
      }
    });
  });

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
