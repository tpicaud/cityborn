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

const AcceptedWarningsSchema = z.array(
  z.object({
    id: z.string(),
    operation: z.string().optional(),
    path: z.string().optional(),
    text: z.string().optional(),
    textIncludes: z.string().optional(),
    reason: z.string(),
  }),
);

type RawOasdiffChange = z.infer<typeof RawOasdiffChangesSchema>[number];
type AcceptedWarning = z.infer<typeof AcceptedWarningsSchema>[number];

function loadAcceptedWarnings(file?: string): AcceptedWarning[] {
  if (file === undefined) return [];
  const raw: unknown = JSON.parse(readFileSync(file, 'utf-8'));
  return AcceptedWarningsSchema.parse(raw);
}

function acceptedWarningReason({
  change,
  acceptedWarnings,
}: {
  change: RawOasdiffChange;
  acceptedWarnings: AcceptedWarning[];
}): string | undefined {
  if (change.level !== 2) return undefined;
  return acceptedWarnings.find(
    (accepted) =>
      accepted.id === change.id &&
      (accepted.operation === undefined ||
        accepted.operation === change.operation) &&
      (accepted.path === undefined || accepted.path === change.path) &&
      (accepted.text === undefined || accepted.text === change.text) &&
      (accepted.textIncludes === undefined ||
        change.text.includes(accepted.textIncludes)),
  )?.reason;
}

function classifyChange({
  change,
  acceptedWarnings,
}: {
  change: RawOasdiffChange;
  acceptedWarnings: AcceptedWarning[];
}): OasdiffChange {
  const acceptanceReason: string | undefined = acceptedWarningReason({
    change,
    acceptedWarnings,
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
  errIgnoreFile,
  acceptedWarningsFile,
}: {
  baseFile: string;
  revisionFile: string;
  errIgnoreFile?: string;
  acceptedWarningsFile?: string;
}): DiffResult {
  const result = spawnSync(
    'oasdiff',
    [
      'breaking',
      '--format',
      'json',
      '--fail-on',
      'WARN',
      ...(errIgnoreFile ? ['--err-ignore', errIgnoreFile] : []),
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
  const acceptedWarnings: AcceptedWarning[] =
    loadAcceptedWarnings(acceptedWarningsFile);
  const changes: OasdiffChange[] = [
    ...rawChanges.map((change) => classifyChange({ change, acceptedWarnings })),
    ...findRequestSchemaTightenings({ baseFile, revisionFile }),
  ];
  return {
    breaking: changes.some((change) => change.severity !== 'accepted'),
    changes,
  };
}
