import { writeFileSync } from 'node:fs';

const [pidFile, mode]: string[] = process.argv.slice(2);
if (!pidFile) throw new Error('Missing descendant PID file.');
process.on('SIGTERM', () => {
  if (mode === 'delayed') setTimeout(() => process.exit(0), 250);
});
writeFileSync(
  pidFile,
  JSON.stringify({ pid: process.pid, parent: process.ppid }),
);
setInterval(() => {}, 1000);
