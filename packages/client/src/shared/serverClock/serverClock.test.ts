import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createServerClock, type ServerClock } from './serverClock';

describe('ServerClock.localDeadline', () => {
  [-10000, 10000].forEach((clockSkew: number) => {
    it(`converts the deadline with a player clock skew of ${clockSkew} ms`, (context) => {
      context.mock.method(Date, 'now', () => 100000 + clockSkew);
      context.mock.method(performance, 'now', () => 1200);
      const serverClock: ServerClock = createServerClock();
      serverClock.synchronize({ serverTime: 100100, requestStartedAt: 1000 });

      const localDeadline: number | undefined =
        serverClock.localDeadline(125000);

      assert.equal(localDeadline, 26000);
      assert.equal((localDeadline ?? 0) - performance.now(), 24800);
    });
  });

  it('retains only the remaining time when resuming an ongoing round', (context) => {
    context.mock.method(performance, 'now', () => 1200);
    const serverClock: ServerClock = createServerClock();
    serverClock.synchronize({ serverTime: 120100, requestStartedAt: 1000 });

    const localDeadline: number | undefined = serverClock.localDeadline(125000);

    assert.equal(localDeadline, 6000);
    assert.equal((localDeadline ?? 0) - performance.now(), 4800);
  });

  it('keeps the same deadline after presence updates and reconnection', (context) => {
    let localTime: number = 1000;
    context.mock.method(performance, 'now', () => localTime);
    const serverClock: ServerClock = createServerClock();
    serverClock.synchronize({ serverTime: 100000, requestStartedAt: 1000 });
    const initialDeadline: number | undefined =
      serverClock.localDeadline(125000);
    localTime = 11000;

    serverClock.synchronize({ serverTime: 105000 });
    serverClock.synchronize({ serverTime: 107000 });
    const resumedDeadline: number | undefined =
      serverClock.localDeadline(125000);

    assert.equal(initialDeadline, 26000);
    assert.equal(resumedDeadline, 26000);
    assert.equal((resumedDeadline ?? 0) - performance.now(), 15000);
  });

  it('ignores player clock changes after synchronization', (context) => {
    let playerTime: number = 90000;
    context.mock.method(Date, 'now', () => playerTime);
    context.mock.method(performance, 'now', () => 1000);
    const serverClock: ServerClock = createServerClock();
    serverClock.synchronize({ serverTime: 100000 });

    playerTime = 190000;

    assert.equal(serverClock.localDeadline(125000), 26000);
  });

  it('replaces a broadcast estimate with a measured HTTP round trip', (context) => {
    let localTime: number = 1000;
    context.mock.method(performance, 'now', () => localTime);
    const serverClock: ServerClock = createServerClock();
    serverClock.synchronize({ serverTime: 100000 });
    localTime = 2000;

    serverClock.synchronize({ serverTime: 101100, requestStartedAt: 1800 });

    assert.equal(serverClock.localDeadline(125000), 25800);
  });

  it('does not compare an unsynchronized server deadline to the player clock', () => {
    const serverClock: ServerClock = createServerClock();

    serverClock.synchronize({ serverTime: undefined });

    assert.equal(serverClock.localDeadline(125000), undefined);
    assert.equal(serverClock.localDeadline(undefined), undefined);
  });
});
