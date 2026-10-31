'use client';

import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import Home from '@/features/auth/Home';

export default function HomePage() {
  return (
    <Screen>
      <LegacyCard>
        <Home />
      </LegacyCard>
    </Screen>
  );
}
