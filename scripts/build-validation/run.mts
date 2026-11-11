import assert from 'node:assert/strict';
import { type ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

type BuildCommand = {
  args: string[];
  cwd?: string;
  rejects?: RegExp;
};

const root: string = fileURLToPath(new URL('../../', import.meta.url));

export async function runCommand({
  args,
  cwd = root,
  rejects,
}: BuildCommand): Promise<void> {
  const child: ChildProcess = spawn('pnpm', args, { cwd, stdio: 'pipe' });
  let output: string = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  const [code]: unknown[] = await once(child, 'exit');
  if (rejects) {
    assert.notEqual(code, 0, `Unexpected success: pnpm ${args.join(' ')}`);
    assert.match(output, rejects);
    return;
  }
  assert.equal(code, 0, output);
}
