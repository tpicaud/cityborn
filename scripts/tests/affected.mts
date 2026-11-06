import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const [base, head]: string[] = process.argv.slice(2);
if (!base || !head)
  throw new Error('Provide the base and head commit for test selection.');
const changedFiles: string[] = execFileSync(
  'git',
  ['diff', '--name-only', `${base}...${head}`],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n');
const transverseChange: boolean = changedFiles.some(
  (file) =>
    !file.includes('/') ||
    file.startsWith('.github/workflows/') ||
    file.startsWith('scripts/tests/') ||
    file.startsWith('lint-rules/'),
);
const pnpm: string = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const graph: unknown = JSON.parse(
  execFileSync(
    pnpm,
    [
      'exec',
      'turbo',
      'run',
      'test',
      '--dry=json',
      ...(transverseChange ? [] : [`--filter=...[${base}...${head}]`]),
    ],
    { encoding: 'utf8' },
  ),
);
if (
  typeof graph !== 'object' ||
  graph === null ||
  !('tasks' in graph) ||
  !Array.isArray(graph.tasks)
) {
  throw new Error('Invalid Turbo test graph.');
}
const packages: string[] = graph.tasks.flatMap((task: unknown): string[] => {
  if (
    typeof task !== 'object' ||
    task === null ||
    !('package' in task) ||
    typeof task.package !== 'string' ||
    !('command' in task) ||
    typeof task.command !== 'string' ||
    task.command === '<NONEXISTENT>' ||
    !('task' in task) ||
    task.task !== 'test'
  )
    return [];
  return [task.package];
});
const output: string = `packages=${JSON.stringify(packages)}\nbackend=${packages.includes('cityborn-backend')}\n`;
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, output);
process.stdout.write(output);
