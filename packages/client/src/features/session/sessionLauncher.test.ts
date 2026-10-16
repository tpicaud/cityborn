import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatSessionCodeInput } from './sessionLauncher';

describe('formatSessionCodeInput', () => {
  it('keeps only digits', () => {
    assert.equal(formatSessionCodeInput('12a-3 4.5'), '12345');
  });

  it('keeps at most six digits', () => {
    assert.equal(formatSessionCodeInput('12345678'), '123456');
  });
});
