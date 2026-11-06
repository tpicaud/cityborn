'use client';

import { useEffect } from 'react';

export function useBrowserBackInterception(onBack: () => void): void {
  useEffect(() => {
    window.history.pushState(window.history.state, '', window.location.href);
    const handlePopState: () => void = () => {
      window.history.pushState(window.history.state, '', window.location.href);
      onBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);
}
