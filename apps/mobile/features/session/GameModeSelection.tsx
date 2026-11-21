import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { ActionGroup, BrandScreen, Button } from '@cityborn/design-system';
import { type ImperativeRouter, useRouter } from 'expo-router';
import { useNavigation } from '@/lib/navigation';

export function GameModeSelection() {
  const router: ImperativeRouter = useRouter();
  const navigation: Navigation = useNavigation();
  const { launchQuickPlay }: SessionLauncher = useSessionLauncher({
    navigation,
  });

  return (
    <BrandScreen kicker="Choisissez votre" title="Mode de jeu">
      <ActionGroup>
        <Button
          label="Jouer en solo"
          onPress={() => router.navigate('/collection')}
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
          onPress={() => router.navigate('/social')}
        />
      </ActionGroup>
    </BrandScreen>
  );
}
