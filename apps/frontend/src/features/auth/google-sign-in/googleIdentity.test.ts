import assert from 'node:assert/strict';
import { after, before, describe, it, type Mock, mock } from 'node:test';

type Script = {
  src: string;
  async: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  remove: () => void;
};

type RenderGoogleSignInButton =
  typeof import('./googleIdentity')['renderGoogleSignInButton'];

const scripts: Script[] = [];
const initialize: Mock<() => void> = mock.fn();
const renderButton: Mock<() => void> = mock.fn();
const originalWindow: PropertyDescriptor | undefined =
  Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalDocument: PropertyDescriptor | undefined =
  Object.getOwnPropertyDescriptor(globalThis, 'document');
let renderGoogleSignInButton: RenderGoogleSignInButton;

before(async () => {
  process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY = 'test-maps-key';
  process.env.NEXT_PUBLIC_REST_BACKEND_URL = 'https://api.cityborn.test';
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client';
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { google: { maps: {} } },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: (): Script => ({
        src: '',
        async: false,
        onload: null,
        onerror: null,
        remove: mock.fn(),
      }),
      head: { appendChild: (script: Script) => scripts.push(script) },
    },
  });
  ({ renderGoogleSignInButton } = await import('./googleIdentity'));
});

after(() => {
  [
    { key: 'window', descriptor: originalWindow },
    { key: 'document', descriptor: originalDocument },
  ].forEach(({ key, descriptor }) => {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
      return;
    }
    Reflect.deleteProperty(globalThis, key);
  });
});

function render(): Promise<void> {
  return renderGoogleSignInButton({
    container: document.createElement('div'),
    onCredential: mock.fn(),
    signal: new AbortController().signal,
  });
}

describe('renderGoogleSignInButton', () => {
  it('loads GIS alongside Maps once and retries after a script failure', async () => {
    const rendering: Promise<void> = render();
    const rejection: Promise<void> = assert.rejects(
      rendering,
      /failed to load/,
    );

    scripts[0]?.onerror?.();

    await rejection;
    assert.equal(initialize.mock.callCount(), 0);
    assert.equal(renderButton.mock.callCount(), 0);

    const firstRendering: Promise<void> = render();
    const secondRendering: Promise<void> = render();
    assert.equal(scripts.length, 2);
    assert.equal(scripts[1]?.src, 'https://accounts.google.com/gsi/client');
    assert.equal(initialize.mock.callCount(), 0);
    Object.defineProperty(window.google, 'accounts', {
      value: { id: { initialize, renderButton } },
    });

    scripts[1]?.onload?.();
    await Promise.all([firstRendering, secondRendering]);
    await render();

    assert.equal(initialize.mock.callCount(), 1);
    assert.equal(renderButton.mock.callCount(), 3);
    assert.equal(scripts.length, 2);
  });
});
