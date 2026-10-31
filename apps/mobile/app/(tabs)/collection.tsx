import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import SoloPlay from '@/features/session/SoloPlay';

export default function CollectionScreen() {
  return (
    <Screen title="Solo">
      <LegacyCard>
        <SoloPlay />
      </LegacyCard>
    </Screen>
  );
}
