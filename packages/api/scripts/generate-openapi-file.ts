import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOpenApiDocument } from '../openapi/generate-openapi';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../openapi');

mkdirSync(outDir, { recursive: true });

const document = getOpenApiDocument();
const filename = `openapi-${document.info.version}.json`;

writeFileSync(join(outDir, filename), JSON.stringify(document, null, 2));
console.log(`Generated: packages/api/openapi/${filename}`);
