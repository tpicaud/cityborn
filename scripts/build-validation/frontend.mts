import assert from 'node:assert/strict';
import { type ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { glob, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { join, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { runCommand } from './run.mts';

const root: string = fileURLToPath(new URL('../../', import.meta.url));
const frontend: string = join(root, 'apps/frontend');
const sources: string = join(frontend, 'src');
const generatedCss: string = join(frontend, 'public/tamagui.generated.css');

async function snapshot(): Promise<Map<string, string>> {
  const paths: string[] = [generatedCss];
  const sourcePaths: string[] = await Array.fromAsync(
    glob('**/*.{ts,tsx,css}', { cwd: sources }),
  );
  paths.push(...sourcePaths.map((path) => join(sources, path)));
  const entries: [string, string][] = await Promise.all(
    paths
      .sort()
      .map(
        async (path): Promise<[string, string]> => [
          path,
          await readFile(path, 'utf8'),
        ],
      ),
  );
  return new Map(entries);
}

async function assertExtraction(): Promise<void> {
  const html: string = await readFile(
    join(frontend, 'out/profile.html'),
    'utf8',
  );
  const scriptPaths: string[] = Array.from(
    html.matchAll(/src="(\/_next\/static\/chunks\/[^"?]+\.js)/g),
    (match) => resolve(frontend, `out${match[1]}`),
  );
  const javascript: string = (
    await Promise.all(scriptPaths.map((path) => readFile(path, 'utf8')))
  ).join('\n');
  const className: string | undefined = javascript.match(
    /className:"is_View [^"]*?(_g-\d+)[^"]*"/,
  )?.[1];
  assert.ok(
    className,
    'No flattened Tamagui view in the exported profile scripts',
  );
  const cssPaths: string[] = Array.from(
    html.matchAll(/href="(\/_next\/static\/chunks\/[^"?]+\.css)/g),
    (match) => resolve(frontend, `out${match[1]}`),
  );
  const css: string = (
    await Promise.all(cssPaths.map((path) => readFile(path, 'utf8')))
  ).join('\n');

  assert.ok(
    css.includes(`.${className}{gap:`),
    'Extracted CSS is not loaded by the exported page',
  );
}

async function visitDevelopment(): Promise<void> {
  const server: Server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address: ReturnType<Server['address']> = server.address();
  assert.ok(address && typeof address === 'object');
  const port: number = address.port;
  server.close();
  await once(server, 'close');
  const child: ChildProcess = spawn(
    'pnpm',
    ['frontend', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
    { cwd: root, stdio: 'pipe', detached: true },
  );
  let output: string = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  async function ready(remaining: number): Promise<void> {
    assert.equal(child.exitCode, null, output);
    assert.ok(remaining > 0, output);
    try {
      const response: Response = await fetch(
        `http://127.0.0.1:${port}/profile`,
        {
          signal: AbortSignal.timeout(15000),
        },
      );
      assert.equal(response.status, 200);
      return;
    } catch {
      await setTimeout(500);
      await ready(remaining - 1);
    }
  }
  try {
    await ready(90);
    const validator: string = await readFile(
      join(frontend, '.next/dev/types/validator.ts'),
      'utf8',
    );
    assert.doesNotMatch(
      validator,
      /import.*(?:AppRouteHandlerRoutes|NextRequest)/,
    );
  } finally {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      const stopped: Promise<unknown[]> = once(child, 'exit');
      process.kill(-child.pid, 'SIGTERM');
      await stopped;
    }
  }
}

const original: Map<string, string> = await snapshot();
const probe: string = join(sources, 'build-validation-probe.tsx');
const layout: string = join(sources, 'app/(tabs)/layout.tsx');
const layoutSource: string = await readFile(layout, 'utf8');

try {
  await rm(join(frontend, '.next'), { recursive: true, force: true });
  await rm(join(frontend, 'out'), { recursive: true, force: true });
  process.stdout.write('Cold build and typecheck\n');
  await runCommand({ args: ['--filter', 'cityborn-frontend', 'build'] });
  await assertExtraction();
  assert.deepEqual(await snapshot(), original);
  await runCommand({ args: ['frontend', 'typecheck'] });

  process.stdout.write(
    'Fresh next dev, typecheck and two consecutive builds\n',
  );
  await visitDevelopment();
  await runCommand({ args: ['frontend', 'typecheck'] });
  await runCommand({ args: ['--filter', 'cityborn-frontend', 'build'] });
  await runCommand({ args: ['--filter', 'cityborn-frontend', 'build'] });
  await assertExtraction();
  await runCommand({ args: ['frontend', 'typecheck'] });
  assert.deepEqual(await snapshot(), original);

  const probes: { source: string; error: RegExp }[] = [
    {
      source:
        "import { useState } from 'react';\nexport const probe: number = 1;\n",
      error: /TS6133.*useState/,
    },
    { source: "export const probe: number = 'invalid';\n", error: /TS2322/ },
  ];
  async function checkProbes(remaining: typeof probes): Promise<void> {
    const [current, ...rest]: typeof probes = remaining;
    if (!current) return;
    await writeFile(probe, current.source);
    await runCommand({
      args: ['frontend', 'typecheck'],
      rejects: current.error,
    });
    await runCommand({
      args: ['--filter', 'cityborn-frontend', 'build'],
      rejects: current.error,
    });
    await rm(probe);
    await checkProbes(rest);
  }
  process.stdout.write(
    'Unused import and type errors reject typecheck and direct build\n',
  );
  await checkProbes(probes);

  process.stdout.write(
    'Invalid Next layout signature rejects typecheck and direct build\n',
  );
  await writeFile(
    layout,
    'export default function InvalidLayout({ children }: { children: number }) { return <div>{children}</div>; }\n',
  );
  await runCommand({
    args: ['frontend', 'typecheck'],
    rejects: /validator\.ts|LayoutProps|LayoutConfig/,
  });
  await runCommand({
    args: ['--filter', 'cityborn-frontend', 'build'],
    rejects: /validator\.ts|LayoutProps|LayoutConfig/,
  });
  await writeFile(layout, layoutSource);

  process.stdout.write('Failed downstream command restores source and CSS\n');
  await runCommand({
    cwd: frontend,
    args: [
      'exec',
      'tamagui',
      'build',
      '--target',
      'web',
      './src',
      '--',
      'node',
      '-e',
      'process.exit(1)',
    ],
    rejects: /[Rr]estor/,
  });
  assert.deepEqual(await snapshot(), original);
  await runCommand({ args: ['frontend', 'typecheck'] });
  process.stdout.write('Frontend build regression passed\n');
} finally {
  await rm(probe, { force: true });
  await writeFile(layout, layoutSource);
}
