import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runCommand } from './run.mts';

const mobileProbe: string = fileURLToPath(
  new URL('../../apps/mobile/build-validation-probe.tsx', import.meta.url),
);
const sharedProbe: string = fileURLToPath(
  new URL('../../packages/core/build-validation-probe.ts', import.meta.url),
);

async function rejectSequentially(commands: string[][]): Promise<void> {
  const [args, ...rest]: string[][] = commands;
  if (!args) return;
  await runCommand({ args, rejects: /TS6133|TS2322/ });
  await rejectSequentially(rest);
}

try {
  process.stdout.write(
    'EAS post-install validates mobile and shared packages\n',
  );
  await runCommand({ args: ['mobile', 'eas-build-post-install'] });

  process.stdout.write(
    'Unused mobile imports reject every native build entry point\n',
  );
  await writeFile(
    mobileProbe,
    "import { useState } from 'react';\nexport const probe: number = 1;\n",
  );
  await rejectSequentially(
    [
      'typecheck',
      'eas-build-post-install',
      'prebuild',
      'build-android:local',
      'android',
      'ios',
    ].map((script) => ['mobile', script]),
  );
  await rm(mobileProbe);

  process.stdout.write(
    'Shared package type errors reject web builds and EAS post-install\n',
  );
  await writeFile(sharedProbe, "export const probe: number = 'invalid';\n");
  await rejectSequentially([
    ['--filter', 'cityborn-frontend', 'build'],
    ['--filter', 'cityborn-back-office', 'build'],
    ['mobile', 'eas-build-post-install'],
  ]);
  await rm(sharedProbe);
  await runCommand({ args: ['mobile', 'eas-build-post-install'] });
  process.stdout.write('Mobile build gates passed\n');
} finally {
  await Promise.all([
    rm(mobileProbe, { force: true }),
    rm(sharedProbe, { force: true }),
  ]);
}
