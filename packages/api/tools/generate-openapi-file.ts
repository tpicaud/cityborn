import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOpenApiDocument } from '../openapi/generate-openapi';
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

const { changed, filename }: ReturnType<typeof versionDocuments> =
  versionDocuments({
    mode,
    versionsDir: join(toolsDir, '../openapi/versions'),
    documents: { http: getOpenApiDocument(), ws: getWsOpenApiDocument() },
  });

console.log(
  changed
    ? `Versioned HTTP and WS documents: ${filename} (${mode}).`
    : 'No API changes detected, skipping.',
);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  if (filename) {
    appendFileSync(process.env.GITHUB_OUTPUT, `filename=${filename}\n`);
  }
}
