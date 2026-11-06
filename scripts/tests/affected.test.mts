import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

type Fixture = {
  directory: string;
  base: string;
  change: (path: string) => void;
};
type Task = { taskId: string; hash: string; task: string };

function fixture(): Fixture {
  const directory: string = mkdtempSync(
    join(tmpdir(), 'cityborn-affected-tests-'),
  );
  const write: (path: string, content: string) => void = (path, content) => {
    mkdirSync(dirname(join(directory, path)), { recursive: true });
    writeFileSync(join(directory, path), content);
  };
  write(
    'package.json',
    JSON.stringify({ name: 'fixture', packageManager: 'pnpm@10.33.2' }),
  );
  write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n  - 'apps/*'\n");
  write('pnpm-lock.yaml', "lockfileVersion: '9.0'\nimporters: {}\n");
  write('.gitignore', 'node_modules\n.turbo\n');
  write(
    'turbo.json',
    readFileSync(new URL('../../turbo.json', import.meta.url), 'utf8'),
  );
  const packages: {
    path: string;
    name: string;
    dependencies: string[];
    test: boolean;
  }[] = [
    {
      path: 'packages/api',
      name: '@cityborn/api',
      dependencies: [],
      test: true,
    },
    {
      path: 'packages/core',
      name: '@cityborn/core',
      dependencies: ['api'],
      test: true,
    },
    {
      path: 'packages/client',
      name: '@cityborn/client',
      dependencies: ['api', 'core'],
      test: true,
    },
    {
      path: 'apps/backend',
      name: 'cityborn-backend',
      dependencies: ['api', 'core'],
      test: true,
    },
    {
      path: 'apps/frontend',
      name: 'cityborn-frontend',
      dependencies: ['client'],
      test: false,
    },
  ];
  packages.forEach((entry) => {
    write(
      `${entry.path}/package.json`,
      JSON.stringify({
        name: entry.name,
        scripts: entry.test ? { test: 'node --test' } : {},
        dependencies: Object.fromEntries(
          entry.dependencies.map((name) => [
            `@cityborn/${name}`,
            'workspace:*',
          ]),
        ),
      }),
    );
  });
  symlinkSync(
    fileURLToPath(new URL('../../node_modules', import.meta.url)),
    join(directory, 'node_modules'),
    'dir',
  );
  execFileSync('git', ['init', '--quiet'], { cwd: directory });
  const commit: () => void = () => {
    execFileSync('git', ['add', '.'], { cwd: directory });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@cityborn.test',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--quiet',
        '-m',
        'fixture',
      ],
      { cwd: directory },
    );
  };
  commit();
  const base: string = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: directory,
    encoding: 'utf8',
  }).trim();
  return {
    directory,
    base,
    change: (path) => {
      write(path, 'changed\n');
      commit();
    },
  };
}

function selected(repository: Fixture): string[] {
  const output: string = execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL('./affected.mts', import.meta.url)),
      repository.base,
      'HEAD',
    ],
    {
      cwd: repository.directory,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: '' },
    },
  );
  const line: string | undefined = output
    .split('\n')
    .find((value) => value.startsWith('packages='));
  assert.ok(line);
  return JSON.parse(line.slice('packages='.length));
}

function hashes(repository: Fixture): Map<string, string> {
  const turbo: string = fileURLToPath(
    new URL('../../node_modules/turbo/bin/turbo', import.meta.url),
  );
  const graph: { tasks: Task[] } = JSON.parse(
    execFileSync(process.execPath, [turbo, 'run', 'test', '--dry=json'], {
      cwd: repository.directory,
      encoding: 'utf8',
    }),
  );
  return new Map(
    graph.tasks
      .filter((task) => task.task === 'test')
      .map((task) => [task.taskId, task.hash]),
  );
}

describe('affected test selection', () => {
  const cases: { path: string; packages: string[] }[] = [
    {
      path: 'packages/api/src/change.ts',
      packages: [
        '@cityborn/api',
        '@cityborn/client',
        '@cityborn/core',
        'cityborn-backend',
      ],
    },
    {
      path: 'packages/core/src/change.ts',
      packages: ['@cityborn/client', '@cityborn/core', 'cityborn-backend'],
    },
    { path: 'packages/client/src/change.ts', packages: ['@cityborn/client'] },
    { path: 'apps/backend/src/change.ts', packages: ['cityborn-backend'] },
    {
      path: '.github/workflows/change.yml',
      packages: [
        '@cityborn/api',
        '@cityborn/client',
        '@cityborn/core',
        'cityborn-backend',
      ],
    },
    {
      path: 'tsconfig.package.json',
      packages: [
        '@cityborn/api',
        '@cityborn/client',
        '@cityborn/core',
        'cityborn-backend',
      ],
    },
    { path: 'apps/frontend/src/change.ts', packages: [] },
  ];
  cases.forEach((scenario) => {
    it(`selects suites and consumers for ${scenario.path}`, () => {
      const repository: Fixture = fixture();
      try {
        repository.change(scenario.path);

        const packages: string[] = selected(repository);

        assert.deepEqual(packages.sort(), scenario.packages);
      } finally {
        rmSync(repository.directory, { recursive: true, force: true });
      }
    });
  });
});

describe('Turbo test hashes', () => {
  it('invalidates consumers after shared changes without scheduling dependency suites', () => {
    const repository: Fixture = fixture();
    try {
      const before: Map<string, string> = hashes(repository);
      repository.change('packages/core/src/change.ts');

      const after: Map<string, string> = hashes(repository);

      assert.equal(
        after.get('@cityborn/api#test'),
        before.get('@cityborn/api#test'),
      );
      [
        '@cityborn/core#test',
        '@cityborn/client#test',
        'cityborn-backend#test',
      ].forEach((task) => {
        assert.notEqual(after.get(task), before.get(task));
      });
      const turbo: string = fileURLToPath(
        new URL('../../node_modules/turbo/bin/turbo', import.meta.url),
      );
      const graph: { tasks: Task[] } = JSON.parse(
        execFileSync(
          process.execPath,
          [turbo, 'run', 'test', '--filter=cityborn-backend', '--dry=json'],
          { cwd: repository.directory, encoding: 'utf8' },
        ),
      );
      assert.deepEqual(
        graph.tasks
          .filter((task) => task.task === 'test')
          .map((task) => task.taskId),
        ['cityborn-backend#test'],
      );
    } finally {
      rmSync(repository.directory, { recursive: true, force: true });
    }
  });
});
