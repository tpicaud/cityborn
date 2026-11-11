'use client';

import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { useNavigation } from '@/lib/navigation';
import { PackCatalog } from './PackCatalog';

export function Collection() {
  const navigation: Navigation = useNavigation();
  const { playSolo }: SessionLauncher = useSessionLauncher({ navigation });

  return <PackCatalog onPlay={playSolo} />;
}
