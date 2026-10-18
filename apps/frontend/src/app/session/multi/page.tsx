'use client';

import type { SessionId } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import { sessionIdFromMultiSessionPath } from '@cityborn/client/session';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import MultiSession from '@/features/session/multi/MultiSession';
import { useNavigation } from '@/lib/navigation';

export default function MultiSessionPage() {
  const navigation: Navigation = useNavigation();
  const sessionID: SessionId | null = sessionIdFromMultiSessionPath(
    usePathname(),
  );

  useEffect(() => {
    if (!sessionID) navigation.returnTo('/');
  }, [sessionID, navigation]);

  if (!sessionID) return <LoadingDialog message="Chargement de la session" />;

  return <MultiSession sessionID={sessionID} />;
}
