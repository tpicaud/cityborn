import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  act,
  cleanup,
  type RenderHookResult,
  renderHook,
} from '@testing-library/react';
import { JSDOM } from 'jsdom';
import { useBrowserBackInterception } from './useBrowserBackInterception';

function installDom(context: TestContext): JSDOM {
  const dom: JSDOM = new JSDOM('', {
    url: 'https://cityborn.test/session/multi/test',
  });
  const descriptors: PropertyDescriptorMap =
    Object.getOwnPropertyDescriptors(globalThis);
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
  });
  context.after(() => {
    cleanup();
    ['window', 'document'].forEach((key: string) => {
      const descriptor: PropertyDescriptor | undefined = descriptors[key];
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
        return;
      }
      Reflect.deleteProperty(globalThis, key);
    });
    dom.window.close();
  });
  return dom;
}

describe('useBrowserBackInterception', () => {
  it('opens the options and restores the history guard on browser back', (context: TestContext) => {
    const dom: JSDOM = installDom(context);
    const departures: string[] = [];
    window.history.replaceState({ session: 'test' }, '', window.location.href);
    const initialHistoryLength: number = window.history.length;
    renderHook(() =>
      useBrowserBackInterception(() => {
        departures.push('options');
      }),
    );
    assert.equal(window.history.length, initialHistoryLength + 1);

    act(() => window.dispatchEvent(new dom.window.PopStateEvent('popstate')));

    assert.deepEqual(departures, ['options']);
    assert.equal(window.history.length, initialHistoryLength + 2);
    assert.deepEqual(window.history.state, { session: 'test' });
    assert.equal(window.location.pathname, '/session/multi/test');
  });

  it('removes the back listener when unmounted', (context: TestContext) => {
    const dom: JSDOM = installDom(context);
    const openings: string[] = [];
    const { unmount }: RenderHookResult<void, unknown> = renderHook(() =>
      useBrowserBackInterception(() => {
        openings.push('options');
      }),
    );

    unmount();
    window.dispatchEvent(new dom.window.PopStateEvent('popstate'));

    assert.deepEqual(openings, []);
  });
});
