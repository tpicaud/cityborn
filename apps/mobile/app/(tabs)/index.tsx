import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import Home from '@/features/auth/Home';

export default function HomeScreen() {
  return (
    <Screen>
      <LegacyCard>
        <Home />
      </LegacyCard>
    </Screen>
  );
}
