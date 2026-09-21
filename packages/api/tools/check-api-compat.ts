import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOpenApiDocument } from '../openapi/generate-openapi';
import { OasdiffNotFoundError } from './compat/oasdiff-runner';
import { formatHumanSummary, toJsonReport } from './compat/report';
import { runCompatCheck } from './compat/run-compat-check';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiDir = join(__dirname, '../openapi');

const args = process.argv.slice(2);
const jsonFlagIndex = args.indexOf('--json');
const jsonOutputFile =
  jsonFlagIndex !== -1 ? args[jsonFlagIndex + 1] : undefined;

function writeCurrentSpecToTempFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'api-compat-'));
  const file = join(dir, 'current.json');
  writeFileSync(file, JSON.stringify(getOpenApiDocument()));
  return file;
}

function main() {
  const currentSpecFile = writeCurrentSpecToTempFile();
  const errIgnoreFile = join(__dirname, 'compat/err-ignore.txt');

  const report = runCompatCheck({
    policyFile: join(openapiDir, 'compat-policy.json'),
    manifestFile: join(openapiDir, 'versions/versions-manifest.json'),
    versionsDir: join(openapiDir, 'versions'),
    currentSpecFile,
    errIgnoreFile: existsSync(errIgnoreFile) ? errIgnoreFile : undefined,
  });

  console.log(formatHumanSummary(report));

  if (jsonOutputFile) {
    writeFileSync(jsonOutputFile, toJsonReport(report));
    console.log(`\nJSON report written to ${jsonOutputFile}`);
  }

  process.exit(report.brokenAt ? 1 : 0);
}

try {
  main();
} catch (error) {
  if (error instanceof OasdiffNotFoundError) {
    console.error(error.message);
    process.exit(2);
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
