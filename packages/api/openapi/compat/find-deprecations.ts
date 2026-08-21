import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { selectVersionsToCheck } from './select-versions';
import type { CompatPolicy, Manifest, ManifestEntry } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DeprecatedItem {
  file: string;
  line: number;
  symbol: string;
  deprecatedSince: string;
  reason: string;
}

export function parseDeprecatedItems(
  content: string,
  filePath: string,
): DeprecatedItem[] {
  const items: DeprecatedItem[] = [];
  const commentPattern = /\/\*\*[\s\S]*?\*\//g;
  let match: RegExpExecArray | null = commentPattern.exec(content);

  while (match !== null) {
    const block = match[0];
    if (block.includes('@deprecated') && block.includes('@deprecatedSince')) {
      const sinceMatch = block.match(/@deprecatedSince\s+(\d{4}-\d{2}-\d{2})/);
      if (sinceMatch) {
        const line = content.slice(0, match.index).split('\n').length;
        const afterComment = content.slice(match.index + block.length);

        items.push({
          file: filePath,
          line,
          symbol: extractSymbolName(afterComment),
          deprecatedSince: sinceMatch[1],
          reason: extractReason(block),
        });
      }
    }
    match = commentPattern.exec(content);
  }

  return items;
}

function extractReason(block: string): string {
  const reasonMatch = block.match(
    /@deprecated\s+([\s\S]*?)(?=@deprecatedSince|\*\/)/,
  );

  return (reasonMatch?.[1] ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
}

function extractSymbolName(codeAfterComment: string): string {
  const nextLine = codeAfterComment
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!nextLine) return 'unknown';

  const declaration = nextLine.match(
    /^(?:export\s+)?(?:const|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  );
  if (declaration) return declaration[1];

  const propertyOrEnumMember = nextLine.match(/^([A-Za-z_$][\w$]*)\s*[:=]/);
  if (propertyOrEnumMember) return propertyOrEnumMember[1];

  return nextLine;
}

function walkTsFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map((entry) => join(dir, entry.toString()))
    .filter(
      (filePath) =>
        filePath.endsWith('.ts') &&
        !filePath.endsWith('.test.ts') &&
        statSync(filePath).isFile(),
    );
}

export function findDeprecatedItems(srcDir: string): DeprecatedItem[] {
  return walkTsFiles(srcDir).flatMap((filePath) =>
    parseDeprecatedItems(readFileSync(filePath, 'utf-8'), filePath),
  );
}

export type DeprecationStatus =
  | { kind: 'not-shipped' }
  | { kind: 'eligible'; originVersion: ManifestEntry }
  | {
      kind: 'pending';
      originVersion: ManifestEntry;
      dayWindowExpiresAt: string;
      versionsStillNeeded: number;
    };

export function resolveDeprecationStatus(
  deprecatedSince: string,
  manifest: Manifest,
  policy: CompatPolicy,
  now: Date,
): DeprecationStatus {
  const sinceMs = new Date(deprecatedSince).getTime();
  const origin = [...manifest.versions]
    .sort((a, b) => a.versionNumber - b.versionNumber)
    .find((entry) => new Date(entry.releasedAt).getTime() >= sinceMs);

  if (!origin) return { kind: 'not-shipped' };

  const active = selectVersionsToCheck(manifest.versions, policy, now);
  const stillRequired = active.some((entry) => entry.file === origin.file);
  if (!stillRequired) return { kind: 'eligible', originVersion: origin };

  const dayWindowExpiresAt = new Date(
    new Date(origin.releasedAt).getTime() + policy.min_days_supported * DAY_MS,
  ).toISOString();
  const versionsNewerThanOrigin = manifest.versions.filter(
    (entry) => entry.versionNumber > origin.versionNumber,
  ).length;
  const versionsStillNeeded = Math.max(
    0,
    policy.min_num_of_version_supported - versionsNewerThanOrigin,
  );

  return {
    kind: 'pending',
    originVersion: origin,
    dayWindowExpiresAt,
    versionsStillNeeded,
  };
}
