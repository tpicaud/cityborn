import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { installDom } from '../../../test/dom';
import { type GameOptionsMenu, useGameOptionsMenu } from './useGameOptionsMenu';

describe('useGameOptionsMenu', () => {
  it('opens and resumes without leaving the game', (context: TestContext) => {
    installDom(context);
    const departures: string[] = [];
    const leaveGame: () => Promise<void> = async () => {
      departures.push('leave');
    };
    const { result }: RenderHookResult<GameOptionsMenu, unknown> = renderHook(
      () => useGameOptionsMenu({ leaveGame }),
    );
    assert.equal(result.current.step, 'closed');

    act(() => result.current.open());
    assert.equal(result.current.step, 'options');
    act(() => result.current.resume());

    assert.equal(result.current.step, 'closed');
    assert.deepEqual(departures, []);
  });

  it('cancels the confirmation without leaving the game', (context: TestContext) => {
    installDom(context);
    const departures: string[] = [];
    const { result }: RenderHookResult<GameOptionsMenu, unknown> = renderHook(
      () =>
        useGameOptionsMenu({
          leaveGame: async () => {
            departures.push('leave');
          },
        }),
    );
    act(() => result.current.open());

    act(() => result.current.requestLeave());
    assert.equal(result.current.step, 'leaveConfirmation');
    act(() => result.current.cancelLeave());

    assert.equal(result.current.step, 'closed');
    assert.deepEqual(departures, []);
  });

  it('waits for the departure to succeed before closing', async (context: TestContext) => {
    installDom(context);
    const departure: ReturnType<typeof Promise.withResolvers<void>> =
      Promise.withResolvers<void>();
    const { result }: RenderHookResult<GameOptionsMenu, unknown> = renderHook(
      () => useGameOptionsMenu({ leaveGame: () => departure.promise }),
    );
    act(() => result.current.requestLeave());
    const confirmation: Promise<void> = result.current.confirmLeave();
    assert.equal(result.current.step, 'leaveConfirmation');

    await act(async () => {
      departure.resolve();
      await confirmation;
    });

    assert.equal(result.current.step, 'closed');
  });

  it('keeps the confirmation open when the departure fails', async (context: TestContext) => {
    installDom(context);
    const failure: Error = new Error('Departure failed');
    const { result }: RenderHookResult<GameOptionsMenu, unknown> = renderHook(
      () =>
        useGameOptionsMenu({
          leaveGame: async () => {
            throw failure;
          },
        }),
    );
    act(() => result.current.requestLeave());

    await act(async () => {
      await assert.rejects(result.current.confirmLeave(), failure);
    });

    assert.equal(result.current.step, 'leaveConfirmation');
  });
});
