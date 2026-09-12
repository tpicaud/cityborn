import type { PlayNavigation, SessionNavigation } from '@cityborn/client/ports';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

export function useSessionNavigation(): SessionNavigation {
  const router = useRouter();
  return useMemo(() => ({ goHome: () => router.replace('/') }), [router]);
}

export function usePlayNavigation(): PlayNavigation {
  const router = useRouter();
  return useMemo(
    () => ({
      goToSoloSession: () => router.navigate('/session/solo'),
      goToMultiSession: (sessionID: string) =>
        router.navigate(`/session/multi/${sessionID}`),
    }),
    [router],
  );
}
