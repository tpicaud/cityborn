import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '../src/contract/contract.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../openapi');

mkdirSync(outDir, { recursive: true });

const document = generateOpenApi(contract, {
  info: { title: 'Cityborn API', version: '1.0.0' },
});

writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(document, null, 2));
console.log('Generated: packages/api/openapi/openapi.json');
