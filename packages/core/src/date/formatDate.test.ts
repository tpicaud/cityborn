import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { formatDate } from './formatDate';

const initialTimeZone: string | undefined = process.env.TZ;

function setLocalTimeZone(timeZone: string): void {
  process.env.TZ = timeZone;
}

afterEach(() => {
  if (initialTimeZone === undefined) {
    delete process.env.TZ;
    return;
  }
  process.env.TZ = initialTimeZone;
});

test('formatDate formats a calendar date as a numeric French date', () => {
  setLocalTimeZone('Europe/Paris');

  assert.equal(formatDate('2026-10-16'), '16/10/2026');
});

test('formatDate keeps a calendar date on the same day west of UTC', () => {
  setLocalTimeZone('America/New_York');

  assert.equal(formatDate('2026-01-06'), '06/01/2026');
});

test('formatDate keeps a calendar date on the same day east of UTC', () => {
  setLocalTimeZone('Pacific/Kiritimati');

  assert.equal(formatDate('2026-01-06'), '06/01/2026');
});

test('formatDate formats a date-time in the local time zone', () => {
  setLocalTimeZone('America/New_York');

  assert.equal(formatDate('2026-01-06T02:30:00.000Z'), '05/01/2026');
});

test('formatDate formats a date-time with an offset in the local time zone', () => {
  setLocalTimeZone('Asia/Tokyo');

  assert.equal(formatDate('2026-01-06T20:00:00+00:00'), '07/01/2026');
});
