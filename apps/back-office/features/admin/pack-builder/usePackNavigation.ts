'use client';

import type { PackEditor } from '@cityborn/client/admin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function usePackNavigation({
  saveState,
  flushPackChanges,
}: Pick<PackEditor, 'saveState' | 'flushPackChanges'>): void {
  const router = useRouter();

  useEffect(() => {
    if (saveState.status === 'saved') return;

    const preventUnload = (event: BeforeUnloadEvent): void => {
      void flushPackChanges();
      event.preventDefault();
      event.returnValue = '';
    };
    const saveBeforeNavigation = (event: MouseEvent): void => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const link: HTMLAnchorElement | null = event.target.closest('a[href]');
      if (!link || link.download || (link.target && link.target !== '_self')) {
        return;
      }
      const target: URL = new URL(link.href);
      if (
        target.origin !== window.location.origin ||
        target.href === window.location.href
      ) {
        return;
      }
      event.preventDefault();
      void flushPackChanges().then((isSaved: boolean) => {
        if (isSaved) router.push(target.pathname + target.search + target.hash);
      });
    };

    window.addEventListener('beforeunload', preventUnload);
    document.addEventListener('click', saveBeforeNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', preventUnload);
      document.removeEventListener('click', saveBeforeNavigation, true);
    };
  }, [saveState.status, flushPackChanges, router]);
}
