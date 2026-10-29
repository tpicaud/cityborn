import assert from 'node:assert/strict';
import { type ModuleHooks, registerHooks } from 'node:module';
import { after, beforeEach, describe, it, type Mock, mock } from 'node:test';
import type { ShareContent, SharingResult } from '@cityborn/client/platform';
import type { setStringAsync } from 'expo-clipboard';
import type { Share, ShareAction } from 'react-native';

const invitation: ShareContent = {
  title: 'Cityborn',
  message: 'Rejoins ma partie sur Cityborn ! Code : 123456',
  url: 'https://cityborn.app/session/multi/123456',
};
const share: Mock<typeof Share.share> = mock.fn<typeof Share.share>();
const copy: Mock<typeof setStringAsync> = mock.fn<typeof setStringAsync>();
const aliasResolution: ModuleHooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(
      specifier === '@/config/client'
        ? new URL('../../config/client.ts', import.meta.url).href
        : specifier,
      context,
    );
  },
});

mock.module('react-native', {
  namedExports: { Share: { share, dismissedAction: 'dismissedAction' } },
});
mock.module('expo-clipboard', { namedExports: { setStringAsync: copy } });
mock.module('../../config/client.ts', {
  namedExports: { mobileClientConfig: { webAppUrl: 'https://cityborn.app' } },
});

const sharingModuleUrl: string = new URL('./sharing.ts', import.meta.url).href;
const { sharing }: typeof import('./sharing') = await import(sharingModuleUrl);

after(() => {
  aliasResolution.deregister();
});
beforeEach(() => {
  share.mock.resetCalls();
  copy.mock.resetCalls();
  share.mock.mockImplementation(
    async (): Promise<ShareAction> => ({ action: 'sharedAction' }),
  );
  copy.mock.mockImplementation(async () => true);
});

describe('sharing.share', () => {
  it('shares the invitation with exactly one link in the native message', async () => {
    const result: SharingResult = await sharing.share(invitation);

    assert.equal(result, 'shared');
    assert.deepEqual(share.mock.calls[0]?.arguments, [
      {
        title: 'Cityborn',
        message:
          'Rejoins ma partie sur Cityborn ! Code : 123456\nhttps://cityborn.app/session/multi/123456',
      },
    ]);
    assert.equal(copy.mock.callCount(), 0);
  });

  it('returns a cancellation without copying', async () => {
    share.mock.mockImplementation(
      async (): Promise<ShareAction> => ({ action: 'dismissedAction' }),
    );

    const result: SharingResult = await sharing.share(invitation);

    assert.equal(result, 'cancelled');
    assert.equal(copy.mock.callCount(), 0);
  });

  it('propagates a native sharing failure without copying', async () => {
    const failure: Error = new Error('native share failed');
    share.mock.mockImplementation(async () => {
      throw failure;
    });

    await assert.rejects(sharing.share(invitation), failure);
    assert.equal(copy.mock.callCount(), 0);
  });
});

describe('sharing.copy', () => {
  it('copies only the session code', async () => {
    await sharing.copy('123456');

    assert.deepEqual(copy.mock.calls[0]?.arguments, ['123456']);
    assert.equal(share.mock.callCount(), 0);
  });

  it('rejects when the native clipboard refuses the text', async () => {
    copy.mock.mockImplementation(async () => false);

    await assert.rejects(sharing.copy('123456'), {
      message: 'Clipboard rejected the text',
    });
  });

  it('propagates a native clipboard failure', async () => {
    const failure: Error = new Error('clipboard unavailable');
    copy.mock.mockImplementation(async () => {
      throw failure;
    });

    await assert.rejects(sharing.copy('123456'), failure);
  });
});
