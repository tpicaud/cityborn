import { buildPlayer, type PlayerId, type SessionPlayer } from '@cityborn/api';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlayerDepartures } from './usePlayerDepartures';

describe('usePlayerDepartures', () => {
  it('dismisses a departed player notice after four seconds', (context) => {
    vi.useFakeTimers();
    context.onTestFinished(() => vi.useRealTimers());
    const host: SessionPlayer = buildPlayer({ username: 'host' });
    const alice: SessionPlayer = buildPlayer({ username: 'alice' });
    const hook: RenderHookResult<PlayerId[], { players: SessionPlayer[] }> =
      renderHook(({ players }) => usePlayerDepartures(players), {
        initialProps: { players: [host, alice] },
      });

    hook.rerender({ players: [host] });

    expect(hook.result.current).toEqual(['alice']);

    act(() => vi.advanceTimersByTime(4000));

    expect(hook.result.current).toEqual([]);
  });
});
