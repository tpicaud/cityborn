import type { Navigation } from '@cityborn/client/platform';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

export function useNavigation(): Navigation {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (path: string) => router.push(path),
      returnTo: (path: string) => router.dismissTo(path),
      back: () => router.back(),
    }),
    [router],
  );
}
