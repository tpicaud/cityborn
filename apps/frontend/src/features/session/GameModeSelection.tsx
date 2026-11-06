'use client';

import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { ActionGroup, BrandScreen, Button } from '@cityborn/design-system';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/lib/navigation';

export function GameModeSelection() {
  const router: AppRouterInstance = useRouter();
  const navigation: Navigation = useNavigation();
  const { launchQuickPlay }: SessionLauncher = useSessionLauncher({
    navigation,
  });

  return (
    <BrandScreen kicker="Choisissez votre" title="Mode de jeu">
      <ActionGroup>
        <Button
          label="Jouer en solo"
          onPress={() => router.push('/collection')}
        />
        <Button
          variant="outline"
          label="Partie rapide"
          onPress={launchQuickPlay}
        />
      </ActionGroup>
      <ActionGroup>
        <Button
          variant="secondary"
          label="Multi"
          onPress={() => router.push('/social')}
        />
      </ActionGroup>
    </BrandScreen>
  );
}
