import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { ServerClock } from '../../shared/serverClock/serverClock';
import {
  ServerClockProvider,
  useServerClock,
} from '../../shared/serverClock/serverClockContext';
import {
  formatTimeLeft,
  type RoundTimer,
  useCountdown,
  useRoundTimer,
} from './roundTimer';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => {
  mock.timers.reset();
  mock.restoreAll();
});

function RoundTimerHarness({
  deadline,
  onTimeUp,
  onUpdate,
}: {
  deadline: number;
  onTimeUp: () => void;
  onUpdate: (timer: RoundTimer) => void;
}): null {
  const serverClock: ServerClock = useServerClock();
  serverClock.synchronize({
    serverTime: 100_000,
    requestStartedAt: performance.now(),
  });
  onUpdate(useRoundTimer({ totalTimeInSeconds: 25, deadline, onTimeUp }));
  return null;
}

function CountdownHarness({
  endAt,
  onCountdownEnd,
  onUpdate,
}: {
  endAt: number;
  onCountdownEnd: () => void;
  onUpdate: (count: number) => void;
}): null {
  const serverClock: ServerClock = useServerClock();
  serverClock.synchronize({
    serverTime: 100_000,
    requestStartedAt: performance.now(),
  });
  const { count }: { count: number } = useCountdown({ endAt, onCountdownEnd });
  onUpdate(count);
  return null;
}

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

describe('useRoundTimer', () => {
  it('resumes from the server deadline and fires once when it expires', async () => {
    mock.timers.enable({ apis: ['setInterval', 'setTimeout'], now: 0 });
    let now: number = 0;
    mock.method(performance, 'now', () => now);
    let latest: RoundTimer | undefined;
    let expiredCount: number = 0;
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(
        createElement(
          ServerClockProvider,
          null,
          createElement(RoundTimerHarness, {
            deadline: 102_000,
            onTimeUp: () => {
              expiredCount += 1;
            },
            onUpdate: (timer: RoundTimer) => {
              latest = timer;
            },
          }),
        ),
      );
    });

    assert.equal(latest?.formattedTimeLeft, '0:02');
    now = 2000;
    await act(async () => mock.timers.tick(2000));
    assert.equal(latest?.isTimeUp, true);
    assert.equal(expiredCount, 1);
    now = 3000;
    await act(async () => mock.timers.tick(1000));
    assert.equal(expiredCount, 1);
    await act(async () => renderer?.unmount());
  });
});

describe('useCountdown', () => {
  it('resumes the countdown from the server clock and ends at zero', async () => {
    mock.timers.enable({ apis: ['setInterval', 'setTimeout'], now: 0 });
    let now: number = 0;
    mock.method(performance, 'now', () => now);
    let latestCount: number | undefined;
    let endedCount: number = 0;
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(
        createElement(
          ServerClockProvider,
          null,
          createElement(CountdownHarness, {
            endAt: 101_500,
            onCountdownEnd: () => {
              endedCount += 1;
            },
            onUpdate: (count: number) => {
              latestCount = count;
            },
          }),
        ),
      );
    });

    assert.equal(latestCount, 2);
    now = 1500;
    await act(async () => mock.timers.tick(1500));
    assert.equal(latestCount, 0);
    assert.equal(endedCount, 1);
    await act(async () => renderer?.unmount());
  });
});
