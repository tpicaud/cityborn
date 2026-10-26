import type { CompatReport } from './types';

export function compatExitCode(report: CompatReport): 0 | 1 {
  return report.brokenAt === undefined ? 0 : 1;
}
