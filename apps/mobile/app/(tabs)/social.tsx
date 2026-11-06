import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import MultiPlay from '@/features/session/MultiPlay';

export default function SocialScreen() {
  return (
    <Screen title="Multi">
      <LegacyCard>
        <MultiPlay />
      </LegacyCard>
    </Screen>
  );
}
