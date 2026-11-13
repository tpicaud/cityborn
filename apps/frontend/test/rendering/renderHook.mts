import '../../../../scripts/test-rendering/dom';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import {
  ApiProvider,
  type ErrorDialogProps,
  ErrorReporterProvider,
} from '@cityborn/client';
import {
  type ContractClient,
  createCookieContractClient,
} from '@cityborn/client/api';
import { createCookieAuthApi } from '@cityborn/client/auth';
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
export type HookRender<T> = {
  readonly current: T;
  container: HTMLElement;
};
export async function waitFor(check: () => boolean): Promise<void> {
  const deadline: number = Date.now() + 2000;
  async function poll(): Promise<void> {
    await act(async () => {
      await setTimeout(5);
    });
    if (check()) return;
    assert.ok(
      Date.now() < deadline,
      'The hook did not reach the expected state',
    );
    return poll();
  }
  await poll();
}
export async function renderHook<T>({
  context,
  useHook,
  respond,
}: {
  context: TestContext;
  useHook: () => T;
  respond: (request: Request) => Response | Promise<Response>;
}): Promise<HookRender<T>> {
  context.mock.method(
    globalThis,
    'fetch',
    (
      input: Parameters<typeof fetch>[0],
      init?: RequestInit,
    ): Promise<Response> => Promise.resolve(respond(new Request(input, init))),
  );
  const container: HTMLElement = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const client: ContractClient = createCookieContractClient('http://localhost');
  let current: { value: T } | undefined;
  function HookView(): null {
    current = { value: useHook() };
    return null;
  }
  function ErrorDialog({
    open,
    errorMessage,
  }: ErrorDialogProps): ReactElement | null {
    return open ? createElement('p', { role: 'alert' }, errorMessage) : null;
  }
  context.after(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
  await act(async () => {
    root.render(
      createElement(
        ErrorReporterProvider,
        { ErrorDialogComponent: ErrorDialog },
        createElement(
          ApiProvider,
          { contractClient: client, authApi: createCookieAuthApi(client) },
          createElement(HookView),
        ),
      ),
    );
  });
  return {
    container,
    get current() {
      assert.ok(current);
      return current.value;
    },
  };
}
