import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import './setupEnvironment';

export default function globalSetup() {
  if (!process.env.TEST_DATABASE_URL || !process.env.TEST_REDIS_URL) {
    throw new Error(
      'TEST_DATABASE_URL and TEST_REDIS_URL are missing: run these tests through pnpm test:int or pnpm test:e2e, which start the worktree environment.',
    );
  }
  execFileSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    {
      cwd: resolve(__dirname, '../..'),
      env: process.env,
      stdio: 'inherit',
    },
  );
}
