import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import type { OpenAPIObject, SchemaObject } from 'openapi3-ts';
import { findRequestSchemaTightenings } from './request-schema-check';

const permissiveSchema: SchemaObject = {
  type: 'object',
  properties: { value: { type: 'string' } },
};
const strictSchema: SchemaObject = {
  type: 'object',
  properties: { value: { type: 'string' } },
  additionalProperties: false,
};
const addedStrictSchema: SchemaObject = {
  type: 'object',
  properties: { added: { type: 'string' } },
  additionalProperties: false,
};

function document(oneOf: SchemaObject[]): OpenAPIObject {
  return {
    openapi: '3.0.2',
    info: { title: 'HTTP', version: 'v1' },
    paths: {
      '/example': {
        post: {
          requestBody: {
            content: {
              'application/json': { schema: { oneOf } },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
    },
  };
}

function writeDocuments({
  t,
  base,
  revision,
}: {
  t: TestContext;
  base: OpenAPIObject;
  revision: OpenAPIObject;
}): { baseFile: string; revisionFile: string } {
  const directory: string = mkdtempSync(join(tmpdir(), 'schema-check-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const baseFile: string = join(directory, 'base.json');
  const revisionFile: string = join(directory, 'revision.json');
  writeFileSync(baseFile, JSON.stringify(base));
  writeFileSync(revisionFile, JSON.stringify(revision));
  return { baseFile, revisionFile };
}

describe('findRequestSchemaTightenings', () => {
  it('accepts reordered oneOf branches', (t) => {
    const files: { baseFile: string; revisionFile: string } = writeDocuments({
      t,
      base: document([permissiveSchema, strictSchema]),
      revision: document([strictSchema, permissiveSchema]),
    });

    const changes: ReturnType<typeof findRequestSchemaTightenings> =
      findRequestSchemaTightenings(files);

    assert.deepEqual(changes, []);
  });

  it('accepts an additional strict oneOf branch when the permissive branch remains', (t) => {
    const files: { baseFile: string; revisionFile: string } = writeDocuments({
      t,
      base: document([permissiveSchema]),
      revision: document([addedStrictSchema, permissiveSchema]),
    });

    const changes: ReturnType<typeof findRequestSchemaTightenings> =
      findRequestSchemaTightenings(files);

    assert.deepEqual(changes, []);
  });
});
