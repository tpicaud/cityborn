import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { findRequestSchemaTightenings } from './request-schema-check';
import type { OasdiffChange } from './types';

const INSTALL_HINT =
  'oasdiff CLI not found on PATH.\n' +
  'Install it with: curl -fsSL https://raw.githubusercontent.com/oasdiff/oasdiff/main/install.sh | sh\n' +
  '(or "brew install oasdiff"). See https://oasdiff.com/docs for other options.';

export class OasdiffNotFoundError extends Error {
  constructor() {
    super(INSTALL_HINT);
    this.name = 'OasdiffNotFoundError';
  }
}

export function assertOasdiffAvailable(): void {
  const probe = spawnSync('oasdiff', ['--version'], { encoding: 'utf-8' });
  if (probe.error || probe.status !== 0) {
    throw new OasdiffNotFoundError();
  }
}

export type DiffResult = {
  breaking: boolean;
  changes: OasdiffChange[];
};

const RawOasdiffChangesSchema = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    level: z.number(),
    operation: z.string().optional(),
    path: z.string().optional(),
    source: z.string().optional(),
  }),
);

const AcceptedChangesSchema = z.array(
  z.object({
    id: z.string(),
    operation: z.string().optional(),
    path: z.string().optional(),
    text: z.string().optional(),
    textIncludes: z.string().optional(),
    responseSchema: z.enum(['api-error']).optional(),
    reason: z.string(),
  }),
);

type RawOasdiffChange = z.infer<typeof RawOasdiffChangesSchema>[number];
type AcceptedChange = z.infer<typeof AcceptedChangesSchema>[number];

function loadAcceptedChanges(file?: string): AcceptedChange[] {
  if (file === undefined) return [];
  const raw: unknown = JSON.parse(readFileSync(file, 'utf-8'));
  return AcceptedChangesSchema.parse(raw);
}

function hasExactKeys({
  value,
  keys,
}: {
  value: { [key: string]: JsonValue };
  keys: string[];
}): boolean {
  const valueKeys: string[] = Object.keys(value).sort();
  const expectedKeys: string[] = [...keys].sort();
  return (
    valueKeys.length === expectedKeys.length &&
    valueKeys.every((key, index) => key === expectedKeys[index])
  );
}

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

function isJsonObject(
  value: JsonValue | undefined,
): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringSchema(value: JsonValue | undefined): boolean {
  return isJsonObject(value) && value.type === 'string';
}

function isApiErrorFieldErrorsSchema(value: JsonValue | undefined): boolean {
  if (!isJsonObject(value) || value.type !== 'array') return false;
  const items: JsonValue | undefined = value.items;
  if (!isJsonObject(items) || items.type !== 'object') return false;
  const properties: JsonValue | undefined = items.properties;
  const required: JsonValue | undefined = items.required;
  return (
    isJsonObject(properties) &&
    hasExactKeys({ value: properties, keys: ['message', 'path'] }) &&
    isStringSchema(properties.path) &&
    isStringSchema(properties.message) &&
    Array.isArray(required) &&
    required.length === 2 &&
    required.includes('path') &&
    required.includes('message')
  );
}

function isApiErrorSchema(value: JsonValue | undefined): boolean {
  if (!isJsonObject(value) || value.type !== 'object') return false;
  const properties: JsonValue | undefined = value.properties;
  const required: JsonValue | undefined = value.required;
  if (!isJsonObject(properties) || !Array.isArray(required)) return false;
  const code: JsonValue | undefined = properties.code;
  const statusCode: JsonValue | undefined = properties.statusCode;
  return (
    hasExactKeys({
      value: properties,
      keys: ['code', 'fieldErrors', 'message', 'statusCode'],
    }) &&
    isJsonObject(code) &&
    code.type === 'string' &&
    Array.isArray(code.enum) &&
    code.enum.every((enumValue) => typeof enumValue === 'string') &&
    isJsonObject(statusCode) &&
    statusCode.type === 'integer' &&
    isStringSchema(properties.message) &&
    isApiErrorFieldErrorsSchema(properties.fieldErrors) &&
    required.length === 3 &&
    required.includes('code') &&
    required.includes('statusCode') &&
    required.includes('message')
  );
}

function responseSchema({
  change,
  revisionDocument,
}: {
  change: RawOasdiffChange;
  revisionDocument: JsonValue;
}): JsonValue | undefined {
  if (change.operation === undefined || change.path === undefined) {
    return undefined;
  }
  const statusMatch: RegExpMatchArray | null =
    change.text.match(/status `([^`]+)`/);
  const status: string | undefined = statusMatch?.[1];
  if (status === undefined || !isJsonObject(revisionDocument)) return undefined;
  const paths: JsonValue | undefined = revisionDocument.paths;
  if (!isJsonObject(paths)) return undefined;
  const pathItem: JsonValue | undefined = paths[change.path];
  if (!isJsonObject(pathItem)) return undefined;
  const operation: JsonValue | undefined =
    pathItem[change.operation.toLowerCase()];
  if (!isJsonObject(operation)) return undefined;
  const responses: JsonValue | undefined = operation.responses;
  if (!isJsonObject(responses)) return undefined;
  const response: JsonValue | undefined = responses[status];
  if (!isJsonObject(response)) return undefined;
  const content: JsonValue | undefined = response.content;
  if (!isJsonObject(content)) return undefined;
  const mediaType: JsonValue | undefined = content['application/json'];
  return isJsonObject(mediaType) ? mediaType.schema : undefined;
}

function acceptedChangeReason({
  change,
  acceptedChanges,
  revisionDocument,
}: {
  change: RawOasdiffChange;
  acceptedChanges: AcceptedChange[];
  revisionDocument: JsonValue;
}): string | undefined {
  return acceptedChanges.find(
    (accepted) =>
      accepted.id === change.id &&
      (accepted.operation === undefined ||
        accepted.operation === change.operation) &&
      (accepted.path === undefined || accepted.path === change.path) &&
      (accepted.text === undefined || accepted.text === change.text) &&
      (accepted.textIncludes === undefined ||
        change.text.includes(accepted.textIncludes)) &&
      (accepted.responseSchema === undefined ||
        (accepted.responseSchema === 'api-error' &&
          isApiErrorSchema(responseSchema({ change, revisionDocument })))),
  )?.reason;
}

function classifyChange({
  change,
  acceptedChanges,
  revisionDocument,
}: {
  change: RawOasdiffChange;
  acceptedChanges: AcceptedChange[];
  revisionDocument: JsonValue;
}): OasdiffChange {
  const acceptanceReason: string | undefined = acceptedChangeReason({
    change,
    acceptedChanges,
    revisionDocument,
  });
  if (acceptanceReason !== undefined) {
    return {
      ...change,
      severity: 'accepted',
      acceptanceReason,
    };
  }
  if (change.level < 2) {
    return {
      ...change,
      severity: 'accepted',
      acceptanceReason: 'oasdiff classifies this change as informational.',
    };
  }
  return {
    ...change,
    severity: change.level >= 3 ? 'error' : 'warning',
  };
}

export function diffBreaking({
  baseFile,
  revisionFile,
  acceptedChangesFile,
}: {
  baseFile: string;
  revisionFile: string;
  acceptedChangesFile?: string;
}): DiffResult {
  const result = spawnSync(
    'oasdiff',
    [
      'breaking',
      '--format',
      'json',
      '--fail-on',
      'WARN',
      baseFile,
      revisionFile,
    ],
    { encoding: 'utf-8' },
  );

  if (result.error) {
    throw new OasdiffNotFoundError();
  }

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `oasdiff failed (exit ${result.status}) on ${baseFile} vs ${revisionFile}:\n${result.stderr}`,
    );
  }

  const stdout = result.stdout.trim();
  const rawChanges: RawOasdiffChange[] = stdout
    ? RawOasdiffChangesSchema.parse(JSON.parse(stdout))
    : [];
  const acceptedChanges: AcceptedChange[] =
    loadAcceptedChanges(acceptedChangesFile);
  const revisionRaw: unknown = JSON.parse(readFileSync(revisionFile, 'utf-8'));
  const revisionDocument: JsonValue = JsonValueSchema.parse(revisionRaw);
  const changes: OasdiffChange[] = [
    ...rawChanges.map((change) =>
      classifyChange({ change, acceptedChanges, revisionDocument }),
    ),
    ...findRequestSchemaTightenings({ baseFile, revisionFile }),
  ];
  return {
    breaking: changes.some((change) => change.severity !== 'accepted'),
    changes,
  };
}
