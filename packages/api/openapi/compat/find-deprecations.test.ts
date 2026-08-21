import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseDeprecatedItems,
  resolveDeprecationStatus,
} from './find-deprecations';
import type { CompatPolicy, Manifest } from './types';

test('parseDeprecatedItems extracts symbol, date and reason from a contract route', () => {
  const content = `
export const sessionContract = c.router({
  /**
   * @deprecated Use \`finalizeGame\` instead.
   * @deprecatedSince 2026-08-21
   */
  endSoloGame: {
    method: 'POST',
  },
});
`;
  const items = parseDeprecatedItems(content, 'session.contract.ts');

  assert.equal(items.length, 1);
  assert.equal(items[0].symbol, 'endSoloGame');
  assert.equal(items[0].deprecatedSince, '2026-08-21');
  assert.equal(items[0].reason, 'Use `finalizeGame` instead.');
});

test('parseDeprecatedItems extracts the symbol from a zod schema field', () => {
  const content = `
export const FooSchema = z.object({
  /**
   * @deprecated Use \`newField\`.
   * @deprecatedSince 2026-01-01
   */
  oldField: z.string().optional(),
  newField: z.string(),
});
`;
  const items = parseDeprecatedItems(content, 'foo.schema.ts');

  assert.equal(items[0].symbol, 'oldField');
});

test('parseDeprecatedItems ignores JSDoc comments without @deprecatedSince', () => {
  const content = `
/**
 * @deprecated no date attached, should be ignored
 */
export const foo = 1;
`;
  assert.deepEqual(parseDeprecatedItems(content, 'foo.ts'), []);
});

const policy: CompatPolicy = {
  min_days_supported: 30,
  min_num_of_version_supported: 3,
};

function manifest(versions: Manifest['versions']): Manifest {
  return { versions };
}

test('resolveDeprecationStatus reports not-shipped when no version covers the date yet', () => {
  const status = resolveDeprecationStatus(
    '2026-08-21',
    manifest([
      {
        file: 'api-v1.json',
        versionNumber: 1,
        releasedAt: '2026-07-01T00:00:00.000Z',
      },
    ]),
    policy,
    new Date('2026-08-25T00:00:00.000Z'),
  );

  assert.equal(status.kind, 'not-shipped');
});

test('resolveDeprecationStatus reports eligible once the origin version ages out of the window', () => {
  const versions: Manifest['versions'] = [
    {
      file: 'api-v1.json',
      versionNumber: 1,
      releasedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      file: 'api-v2.json',
      versionNumber: 2,
      releasedAt: '2026-01-05T00:00:00.000Z',
    },
    {
      file: 'api-v3.json',
      versionNumber: 3,
      releasedAt: '2026-01-10T00:00:00.000Z',
    },
    {
      file: 'api-v4.json',
      versionNumber: 4,
      releasedAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  const status = resolveDeprecationStatus(
    '2026-01-01',
    manifest(versions),
    policy,
    new Date('2026-03-15T00:00:00.000Z'),
  );

  assert.equal(status.kind, 'eligible');
});

test('resolveDeprecationStatus reports pending with a day-window deadline and version count needed', () => {
  const status = resolveDeprecationStatus(
    '2026-08-21',
    manifest([
      {
        file: 'api-v1.json',
        versionNumber: 1,
        releasedAt: '2026-08-21T00:00:00.000Z',
      },
    ]),
    policy,
    new Date('2026-08-25T00:00:00.000Z'),
  );

  assert.equal(status.kind, 'pending');
  if (status.kind !== 'pending') return;
  assert.equal(status.dayWindowExpiresAt, '2026-09-20T00:00:00.000Z');
  assert.equal(status.versionsStillNeeded, 3);
});
