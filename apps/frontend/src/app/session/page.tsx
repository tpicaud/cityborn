'use client';

import type { PackId, SessionId } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import {
  launchedPackIdFromSearchParams,
  sessionIdFromSessionPath,
} from '@cityborn/client/session';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import Session from '@/features/session/Session';
import { useNavigation } from '@/lib/navigation';

function SessionRoute() {
  const navigation: Navigation = useNavigation();
  const sessionID: SessionId | null = sessionIdFromSessionPath(usePathname());
  const launchedPackId: PackId | undefined = launchedPackIdFromSearchParams(
    Object.fromEntries(useSearchParams()),
  );

  useEffect(() => {
    if (!sessionID) navigation.returnTo('/');
  }, [sessionID, navigation]);

  if (!sessionID) return <LoadingDialog message="Chargement de la session" />;

  return <Session sessionID={sessionID} launchedPackId={launchedPackId} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<LoadingDialog message="Chargement de la session" />}>
      <SessionRoute />
    </Suspense>
  );
}
