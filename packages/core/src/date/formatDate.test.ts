import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
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

describe('formatDate', () => {
  it('formats a calendar date as a numeric French date', () => {
    setLocalTimeZone('Europe/Paris');

    const formattedDate: string = formatDate('2026-10-16');

    assert.equal(formattedDate, '16/10/2026');
  });

  it('keeps a calendar date on the same day west of UTC', () => {
    setLocalTimeZone('America/New_York');

    const formattedDate: string = formatDate('2026-01-06');

    assert.equal(formattedDate, '06/01/2026');
  });

  it('keeps a calendar date on the same day east of UTC', () => {
    setLocalTimeZone('Pacific/Kiritimati');

    const formattedDate: string = formatDate('2026-01-06');

    assert.equal(formattedDate, '06/01/2026');
  });

  it('formats a date-time in the local time zone', () => {
    setLocalTimeZone('America/New_York');

    const formattedDate: string = formatDate('2026-01-06T02:30:00.000Z');

    assert.equal(formattedDate, '05/01/2026');
  });

  it('formats a date-time with an offset in the local time zone', () => {
    setLocalTimeZone('Asia/Tokyo');

    const formattedDate: string = formatDate('2026-01-06T20:00:00+00:00');

    assert.equal(formattedDate, '07/01/2026');
  });
});
