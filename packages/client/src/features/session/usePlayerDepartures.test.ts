import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildPlayer,
  type PlayerId,
  PlayerIdSchema,
  type SessionPlayer,
} from '@cityborn/api';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { installDom } from '../../../test/dom';
import { departedPlayerIDs, usePlayerDepartures } from './usePlayerDepartures';

const alice: PlayerId = PlayerIdSchema.parse('alice');

describe('departedPlayerIDs', () => {
  it('lists the players missing from the new players', () => {
    const departures: PlayerId[] = departedPlayerIDs({
      previousPlayers: [
        buildPlayer({ username: 'host' }),
        buildPlayer({ username: 'alice' }),
      ],
      players: [buildPlayer({ username: 'host' })],
    });

    assert.deepEqual(departures, [alice]);
  });

  it('ignores a player who joined or disconnected', () => {
    const departures: PlayerId[] = departedPlayerIDs({
      previousPlayers: [buildPlayer({ username: 'host' })],
      players: [
        buildPlayer({ username: 'host', connected: false }),
        buildPlayer({ username: 'alice' }),
      ],
    });

    assert.deepEqual(departures, []);
  });
});

describe('usePlayerDepartures', () => {
  it('announces a departure for four seconds across session updates', (context: TestContext) => {
    installDom(context);
    context.mock.timers.enable({ apis: ['setTimeout'] });
    const initialPlayers: SessionPlayer[] = [
      buildPlayer({ username: 'host' }),
      buildPlayer({ username: 'alice' }),
    ];
    const {
      result,
      rerender,
    }: RenderHookResult<PlayerId[], SessionPlayer[] | undefined> = renderHook<
      PlayerId[],
      SessionPlayer[] | undefined
    >(usePlayerDepartures, { initialProps: initialPlayers });
    assert.deepEqual(result.current, []);

    rerender([buildPlayer({ username: 'host' })]);
    assert.deepEqual(result.current, [alice]);
    act(() => context.mock.timers.tick(2000));
    rerender([buildPlayer({ username: 'host' })]);
    act(() => context.mock.timers.tick(1999));
    assert.deepEqual(result.current, [alice]);
    act(() => context.mock.timers.tick(1));

    assert.deepEqual(result.current, []);
  });

  it('replaces a notice and restarts its delay for a later departure', (context: TestContext) => {
    installDom(context);
    context.mock.timers.enable({ apis: ['setTimeout'] });
    const initialPlayers: SessionPlayer[] = [
      buildPlayer({ username: 'host' }),
      buildPlayer({ username: 'alice' }),
      buildPlayer({ username: 'bob' }),
    ];
    const {
      result,
      rerender,
    }: RenderHookResult<PlayerId[], SessionPlayer[] | undefined> = renderHook<
      PlayerId[],
      SessionPlayer[] | undefined
    >(usePlayerDepartures, { initialProps: initialPlayers });
    rerender([
      buildPlayer({ username: 'host' }),
      buildPlayer({ username: 'bob' }),
    ]);
    act(() => context.mock.timers.tick(3000));

    rerender([buildPlayer({ username: 'host' })]);
    act(() => context.mock.timers.tick(1000));
    assert.deepEqual(result.current, [PlayerIdSchema.parse('bob')]);
    act(() => context.mock.timers.tick(3000));

    assert.deepEqual(result.current, []);
  });

  it('does not announce the first loaded players or a disconnection', (context: TestContext) => {
    installDom(context);
    const {
      result,
      rerender,
    }: RenderHookResult<PlayerId[], SessionPlayer[] | undefined> = renderHook<
      PlayerId[],
      SessionPlayer[] | undefined
    >(usePlayerDepartures, { initialProps: undefined });

    rerender([buildPlayer({ username: 'alice' })]);
    rerender([buildPlayer({ username: 'alice', connected: false })]);

    assert.deepEqual(result.current, []);
  });

  it('cancels the pending notice timeout when unmounted', (context: TestContext) => {
    installDom(context);
    const clearTimeoutMock: ReturnType<
      typeof context.mock.method<typeof globalThis, 'clearTimeout'>
    > = context.mock.method(globalThis, 'clearTimeout');
    const initialPlayers: SessionPlayer[] = [
      buildPlayer({ username: 'host' }),
      buildPlayer({ username: 'alice' }),
    ];
    const {
      rerender,
      unmount,
    }: RenderHookResult<PlayerId[], SessionPlayer[] | undefined> = renderHook<
      PlayerId[],
      SessionPlayer[] | undefined
    >(usePlayerDepartures, { initialProps: initialPlayers });
    rerender([buildPlayer({ username: 'host' })]);

    unmount();

    assert.equal(clearTimeoutMock.mock.callCount(), 1);
  });
});
