'use client';

import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import MultiPlay from '@/features/session/MultiPlay';

export default function SocialPage() {
  return (
    <Screen title="Multi">
      <LegacyCard>
        <MultiPlay />
      </LegacyCard>
    </Screen>
  );
}
