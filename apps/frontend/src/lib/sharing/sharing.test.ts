import assert from 'node:assert/strict';
import { afterEach, describe, it, type Mock, mock } from 'node:test';
import type { ShareContent, SharingResult } from '@cityborn/client/platform';
import { sharing } from './sharing.ts';

const invitation: ShareContent = {
  title: 'Cityborn',
  message: 'Rejoins ma partie sur Cityborn ! Code : 123456',
  url: 'https://cityborn.app/session/multi/123456',
};
const originalNavigator: PropertyDescriptor | undefined =
  Object.getOwnPropertyDescriptor(globalThis, 'navigator');

function setNavigator(
  value: Pick<Navigator, 'clipboard'> &
    Partial<Pick<Navigator, 'share' | 'userAgent' | 'maxTouchPoints'>>,
): void {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: 0,
      ...value,
    },
    configurable: true,
  });
}

function clipboard(writeText: (text: string) => Promise<void>): Clipboard {
  return {
    writeText,
    read: async () => [],
    readText: async () => '',
    write: async () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

afterEach(() => {
  if (originalNavigator) {
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
    return;
  }
  Reflect.deleteProperty(globalThis, 'navigator');
});

describe('sharing.share', () => {
  it('copies only the link on desktop when browser sharing is unavailable', async () => {
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {});
    setNavigator({ clipboard: clipboard(writeText) });

    const result: SharingResult = await sharing.share(invitation);

    assert.equal(result, 'copied');
    assert.deepEqual(writeText.mock.calls[0]?.arguments, [
      'https://cityborn.app/session/multi/123456',
    ]);
  });

  const desktopBrowsers: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>[] = [
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: 0,
    },
    {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: 10,
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      maxTouchPoints: 0,
    },
  ];

  desktopBrowsers.forEach(({ userAgent, maxTouchPoints }) => {
    it(`copies only the link on desktop despite browser sharing with ${maxTouchPoints} touch points and ${userAgent}`, async () => {
      const share: Mock<Navigator['share']> = mock.fn<Navigator['share']>(
        async (_data: ShareData) => {},
      );
      const writeText: Mock<Clipboard['writeText']> = mock.fn<
        Clipboard['writeText']
      >(async (_text: string) => {});
      setNavigator({
        share,
        clipboard: clipboard(writeText),
        userAgent,
        maxTouchPoints,
      });

      const result: SharingResult = await sharing.share(invitation);

      assert.equal(result, 'copied');
      assert.deepEqual(writeText.mock.calls[0]?.arguments, [
        'https://cityborn.app/session/multi/123456',
      ]);
      assert.equal(share.mock.callCount(), 0);
    });
  });

  const mobileBrowsers: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>[] = [
    {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile',
      maxTouchPoints: 5,
    },
    {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710)',
      maxTouchPoints: 5,
    },
    {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      maxTouchPoints: 5,
    },
    {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',
      maxTouchPoints: 5,
    },
    {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      maxTouchPoints: 5,
    },
  ];

  mobileBrowsers.forEach(({ userAgent, maxTouchPoints }) => {
    it(`shares the message and link directly from the action on ${userAgent}`, async () => {
      const share: Mock<Navigator['share']> = mock.fn<Navigator['share']>(
        async (_data: ShareData) => {},
      );
      const writeText: Mock<Clipboard['writeText']> = mock.fn<
        Clipboard['writeText']
      >(async (_text: string) => {});
      setNavigator({
        share,
        clipboard: clipboard(writeText),
        userAgent,
        maxTouchPoints,
      });

      const pending: Promise<SharingResult> = sharing.share(invitation);
      assert.equal(share.mock.callCount(), 1);
      const result: SharingResult = await pending;

      assert.equal(result, 'shared');
      assert.deepEqual(share.mock.calls[0]?.arguments, [
        {
          title: 'Cityborn',
          text: 'Rejoins ma partie sur Cityborn ! Code : 123456',
          url: 'https://cityborn.app/session/multi/123456',
        },
      ]);
      assert.equal(writeText.mock.callCount(), 0);
    });
  });

  it('copies only the link on mobile when browser sharing is unavailable', async () => {
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {});
    setNavigator({
      clipboard: clipboard(writeText),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });

    const result: SharingResult = await sharing.share(invitation);

    assert.equal(result, 'copied');
    assert.deepEqual(writeText.mock.calls[0]?.arguments, [
      'https://cityborn.app/session/multi/123456',
    ]);
  });

  it('returns a cancellation without copying the link', async () => {
    const share: Mock<Navigator['share']> = mock.fn<Navigator['share']>(
      async () => {
        throw new DOMException('cancelled', 'AbortError');
      },
    );
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {});
    setNavigator({
      share,
      clipboard: clipboard(writeText),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });

    const result: SharingResult = await sharing.share(invitation);

    assert.equal(result, 'cancelled');
    assert.equal(writeText.mock.callCount(), 0);
  });

  it('propagates a real sharing failure without silently copying', async () => {
    const failure: Error = new Error('share failed');
    const share: Mock<Navigator['share']> = mock.fn<Navigator['share']>(
      async () => {
        throw failure;
      },
    );
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {});
    setNavigator({
      share,
      clipboard: clipboard(writeText),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });

    await assert.rejects(sharing.share(invitation), failure);
    assert.equal(writeText.mock.callCount(), 0);
  });

  it('propagates a failed clipboard operation and allows retrying', async () => {
    const failure: Error = new Error('clipboard denied');
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {
      throw failure;
    });
    setNavigator({ clipboard: clipboard(writeText) });

    await assert.rejects(sharing.share(invitation), failure);
    setNavigator({ clipboard: clipboard(async () => {}) });
    assert.equal(await sharing.share(invitation), 'copied');
  });
});

describe('sharing.copy', () => {
  it('copies only the code', async () => {
    const writeText: Mock<Clipboard['writeText']> = mock.fn<
      Clipboard['writeText']
    >(async (_text: string) => {});
    setNavigator({ clipboard: clipboard(writeText) });

    await sharing.copy('123456');

    assert.deepEqual(writeText.mock.calls[0]?.arguments, ['123456']);
  });
});
