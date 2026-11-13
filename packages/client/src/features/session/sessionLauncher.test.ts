import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatSessionCodeInput } from './sessionLauncher';

describe('formatSessionCodeInput', () => {
  it('keeps only digits', () => {
    const sessionCode: string = formatSessionCodeInput('12a-3 4.5');

    assert.equal(sessionCode, '12345');
  });

  it('keeps at most six digits', () => {
    const sessionCode: string = formatSessionCodeInput('12345678');

    assert.equal(sessionCode, '123456');
  });
});
