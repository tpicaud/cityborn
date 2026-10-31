'use client';

import type { Navigation } from '@cityborn/client/platform';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import { SignUpForm } from '@/features/auth/SignUpForm';
import { useNavigation } from '@/lib/navigation';

export default function SignUpPage() {
  const navigation: Navigation = useNavigation();

  return (
    <Screen onBack={() => navigation.returnTo('/')}>
      <LegacyCard>
        <SignUpForm />
      </LegacyCard>
    </Screen>
  );
}
