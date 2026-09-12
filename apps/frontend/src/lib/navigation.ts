'use client';

import type { PlayNavigation, SessionNavigation } from '@cityborn/client/ports';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function useSessionNavigation(): SessionNavigation {
  const router = useRouter();
  return useMemo(() => ({ goHome: () => router.push('/') }), [router]);
}

export function usePlayNavigation(): PlayNavigation {
  const router = useRouter();
  return useMemo(
    () => ({
      goToSoloSession: () => router.push('/session/solo'),
      goToMultiSession: (sessionID: string) =>
        router.push(`/session/multi/${sessionID}`),
    }),
    [router],
  );
}
