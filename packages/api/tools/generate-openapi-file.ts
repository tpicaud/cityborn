import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOpenApiDocument } from '../openapi/http/generate-openapi';
import { getWsOpenApiDocument } from '../openapi/ws/generate-ws-openapi';
import { versionDocuments } from './versioning/version-documents';

const toolsDir: string = dirname(fileURLToPath(import.meta.url));
const modeArg: string | undefined = process.argv.find((arg) =>
  arg.startsWith('--mode='),
);
const mode: string | undefined = modeArg?.slice('--mode='.length);

if (mode !== 'draft' && mode !== 'release') {
  throw new Error('Usage: generate-openapi-file.ts --mode=draft|release');
}

const result: ReturnType<typeof versionDocuments> = versionDocuments({
  mode,
  newDraft: process.argv.includes('--new-draft'),
  versionsDir: join(toolsDir, '../openapi/versions'),
  documents: { http: getOpenApiDocument(), ws: getWsOpenApiDocument() },
});

console.log(
  result.changed
    ? `Versioned HTTP and WS documents: v${result.versionNumber} (${mode}).`
    : 'No API changes detected, skipping.',
);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`);
  if (result.changed) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=v${result.versionNumber}\n`,
    );
  }
}
