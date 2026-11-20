import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import './setupEnvironment';

export default function globalSetup() {
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
