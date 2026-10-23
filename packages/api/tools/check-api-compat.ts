import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOpenApiDocument } from '../openapi/generate-openapi';
import { getWsOpenApiDocument } from '../openapi/ws/generate-ws-openapi';
import { OasdiffNotFoundError } from './compat/oasdiff-runner';
import { formatHumanSummary, toJsonReport } from './compat/report';
import { runCompatCheck } from './compat/run-compat-check';
import type { CompatReport } from './compat/types';

const toolsDir: string = dirname(fileURLToPath(import.meta.url));
const openapiDir: string = join(toolsDir, '../openapi');
const args: string[] = process.argv.slice(2);
const jsonFlagIndex: number = args.indexOf('--json');
const jsonOutputFile: string | undefined =
  jsonFlagIndex !== -1 ? args[jsonFlagIndex + 1] : undefined;

function main(): number {
  const temporaryDir: string = mkdtempSync(join(tmpdir(), 'api-compat-'));
  try {
    const currentSpecFile: string = join(temporaryDir, 'http.json');
    const currentWsSpecFile: string = join(temporaryDir, 'ws.json');
    writeFileSync(currentSpecFile, JSON.stringify(getOpenApiDocument()));
    writeFileSync(currentWsSpecFile, JSON.stringify(getWsOpenApiDocument()));
    const errIgnoreFile: string = join(toolsDir, 'compat/err-ignore.txt');
    const report: CompatReport = runCompatCheck({
      policyFile: join(openapiDir, 'compat-policy.json'),
      manifestFile: join(openapiDir, 'versions/versions-manifest.json'),
      versionsDir: join(openapiDir, 'versions'),
      currentSpecFile,
      currentWsSpecFile,
      errIgnoreFile: existsSync(errIgnoreFile) ? errIgnoreFile : undefined,
    });

    console.log(formatHumanSummary(report));
    if (jsonOutputFile) {
      writeFileSync(jsonOutputFile, toJsonReport(report));
      console.log(`\nJSON report written to ${jsonOutputFile}`);
    }
    return report.brokenAt ? 1 : 0;
  } finally {
    rmSync(temporaryDir, { recursive: true, force: true });
  }
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(
    error instanceof OasdiffNotFoundError || error instanceof Error
      ? error.message
      : error,
  );
  process.exitCode = 2;
}
