'use client';

import type { Navigation } from '@cityborn/client/platform';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function useNavigation(): Navigation {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (path: string) => router.push(path),
      replace: (path: string) => router.replace(path),
      back: () => router.back(),
    }),
    [router],
  );
}
