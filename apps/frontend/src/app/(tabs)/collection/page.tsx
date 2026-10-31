'use client';

import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import SoloPlay from '@/features/session/SoloPlay';

export default function CollectionPage() {
  return (
    <Screen title="Solo">
      <LegacyCard>
        <SoloPlay />
      </LegacyCard>
    </Screen>
  );
}
