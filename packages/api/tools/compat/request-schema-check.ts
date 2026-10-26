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

function equalJsonValues(left: JsonValue, right: JsonValue): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => equalJsonValues(value, right[index]))
    );
  }
  if (isJsonObject(left) && isJsonObject(right)) {
    const leftEntries: Array<[string, JsonValue]> = Object.entries(left);
    const rightEntries: Array<[string, JsonValue]> = Object.entries(right);
    return (
      leftEntries.length === rightEntries.length &&
      leftEntries.every(
        ([key, value]) =>
          right[key] !== undefined && equalJsonValues(value, right[key]),
      )
    );
  }
  return left === right;
}

function pairChangedArrayValues({
  base,
  revision,
}: {
  base: JsonValue[];
  revision: JsonValue[];
}): Array<{ base: JsonValue; revision: JsonValue | undefined }> {
  const unmatchedRevision: JsonValue[] = [...revision];
  const unmatchedBase: JsonValue[] = base.filter((baseValue) => {
    const unchangedIndex: number = unmatchedRevision.findIndex(
      (revisionValue) => equalJsonValues(baseValue, revisionValue),
    );
    if (unchangedIndex === -1) return true;
    unmatchedRevision.splice(unchangedIndex, 1);
    return false;
  });
  return unmatchedBase.map((baseValue, index) => ({
    base: baseValue,
    revision: unmatchedRevision[index],
  }));
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
    return pairChangedArrayValues({ base, revision }).flatMap(
      ({ base: baseValue, revision: revisionValue }, index) =>
        findStrictSchemas({
          base: baseValue,
          revision: revisionValue,
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
