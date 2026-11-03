import type { Sharing } from '@cityborn/client/platform';
import * as Clipboard from 'expo-clipboard';
import { Share, type ShareAction } from 'react-native';
import { mobileClientConfig } from '@/config/client';

export const sharing: Sharing = {
  webAppUrl: () => mobileClientConfig.webAppUrl,
  copy: async (text) => {
    const copied: boolean = await Clipboard.setStringAsync(text);
    if (!copied) throw new Error('Clipboard rejected the text');
  },
  async share({ title, message, url }) {
    const result: ShareAction = await Share.share({
      title,
      message: `${message}\n${url}`,
    });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  },
};
