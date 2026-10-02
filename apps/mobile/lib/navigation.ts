import type { Navigation, NavigationPath } from '@cityborn/client/platform';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

export function useNavigation(): Navigation {
  const router = useRouter();

  return useMemo(
    () => ({
      push: (path: NavigationPath) => router.push(path),
      returnTo: (path: NavigationPath) => router.dismissTo(path),
      back: () => router.back(),
    }),
    [router],
  );
}
