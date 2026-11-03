import type { Sharing } from '@cityborn/client/platform';

export const sharing: Sharing = {
  webAppUrl: () => window.location.origin,
  copy: (text) => navigator.clipboard.writeText(text),
  async share({ title, message, url }) {
    if (!navigator.share) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
    try {
      await navigator.share({ title, text: message, url });
      return 'shared';
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError')
        return 'cancelled';
      throw error;
    }
  },
};
