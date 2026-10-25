'use client';

import type { SessionId } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import { sessionIdFromSessionPath } from '@cityborn/client/session';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import Session from '@/features/session/Session';
import { useNavigation } from '@/lib/navigation';

export default function SessionPage() {
  const navigation: Navigation = useNavigation();
  const sessionID: SessionId | null = sessionIdFromSessionPath(usePathname());

  useEffect(() => {
    if (!sessionID) navigation.returnTo('/');
  }, [sessionID, navigation]);

  if (!sessionID) return <LoadingDialog message="Chargement de la session" />;

  return <Session sessionID={sessionID} />;
}
