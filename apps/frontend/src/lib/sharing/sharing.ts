import type { Sharing } from '@cityborn/client/platform';

function isMobileBrowser(): boolean {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

export const sharing: Sharing = {
  webAppUrl: () => window.location.origin,
  copy: (text) => navigator.clipboard.writeText(text),
  async share({ title, message, url }) {
    if (!isMobileBrowser() || !navigator.share) {
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
