import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatTimeLeft } from './roundTimer';

describe('formatTimeLeft', () => {
  it('formats whole seconds as minutes and seconds', () => {
    const formattedTimeLeft: string = formatTimeLeft(65);

    assert.equal(formattedTimeLeft, '1:05');
  });

  it('rounds up to the started second', () => {
    const formattedTimeLeft: string = formatTimeLeft(24.2);

    assert.equal(formattedTimeLeft, '0:25');
  });

  it('shows the last started second until the time is up', () => {
    const formattedTimeLeft: string = formatTimeLeft(0.4);

    assert.equal(formattedTimeLeft, '0:01');
  });
});
