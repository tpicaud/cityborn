import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { OasdiffChange } from './types';

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
);

const httpMethods: string[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

function isJsonObject(
  value: JsonValue | undefined,
): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readDocument(file: string): JsonValue {
  const raw: unknown = JSON.parse(readFileSync(file, 'utf-8'));
  return JsonValueSchema.parse(raw);
}

function requestSchemaName(segments: string[]): string {
  const propertyNames: string[] = segments.flatMap((segment, index) =>
    segment === 'properties' && segments[index + 1] !== undefined
      ? [segments[index + 1]]
      : [],
  );
  return propertyNames.length === 0
    ? 'request body'
    : `request property \`${propertyNames.join('/')}\``;
}

function findStrictSchemas({
  base,
  revision,
  segments,
}: {
  base: JsonValue | undefined;
  revision: JsonValue | undefined;
  segments: string[];
}): string[] {
  if (Array.isArray(base) && Array.isArray(revision)) {
    return base.flatMap((value, index) =>
      findStrictSchemas({
        base: value,
        revision: revision[index],
        segments: [...segments, String(index)],
      }),
    );
  }
  if (!isJsonObject(base) || !isJsonObject(revision)) return [];

  const current: string[] =
    base.additionalProperties !== false &&
    revision.additionalProperties === false
      ? [requestSchemaName(segments)]
      : [];
  return [
    ...current,
    ...Object.entries(base).flatMap(([key, value]) =>
      findStrictSchemas({
        base: value,
        revision: revision[key],
        segments: [...segments, key],
      }),
    ),
  ];
}

export function findRequestSchemaTightenings({
  baseFile,
  revisionFile,
}: {
  baseFile: string;
  revisionFile: string;
}): OasdiffChange[] {
  const baseDocument: JsonValue = readDocument(baseFile);
  const revisionDocument: JsonValue = readDocument(revisionFile);
  if (!isJsonObject(baseDocument) || !isJsonObject(revisionDocument)) return [];

  const basePaths: JsonValue | undefined = baseDocument.paths;
  const revisionPaths: JsonValue | undefined = revisionDocument.paths;
  if (!isJsonObject(basePaths) || !isJsonObject(revisionPaths)) return [];

  return Object.entries(basePaths).flatMap(([path, basePathItem]) => {
    const revisionPathItem: JsonValue | undefined = revisionPaths[path];
    if (!isJsonObject(basePathItem) || !isJsonObject(revisionPathItem)) {
      return [];
    }
    return httpMethods.flatMap((method) => {
      const baseOperation: JsonValue | undefined = basePathItem[method];
      const revisionOperation: JsonValue | undefined = revisionPathItem[method];
      if (!isJsonObject(baseOperation) || !isJsonObject(revisionOperation)) {
        return [];
      }
      const strictSchemas: string[] = findStrictSchemas({
        base: baseOperation.requestBody,
        revision: revisionOperation.requestBody,
        segments: [],
      });
      return strictSchemas.map(
        (schema): OasdiffChange => ({
          id: 'request-schema-became-strict',
          text: `the ${schema} now rejects additional properties`,
          level: 3,
          severity: 'error',
          operation: method.toUpperCase(),
          path,
          source: 'cityborn',
        }),
      );
    });
  });
}
