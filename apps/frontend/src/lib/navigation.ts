'use client';

import type { Navigation, NavigationPath } from '@cityborn/client/platform';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function useNavigation(): Navigation {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (path: NavigationPath) => router.push(path),
      returnTo: (path: NavigationPath) => router.replace(path),
      back: () => router.back(),
    }),
    [router],
  );
}
