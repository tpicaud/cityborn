'use client';

import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import { SignInForm } from '@/features/auth/SignInForm';
import { Profile } from '@/features/profile/Profile';

export default function ProfilePage() {
  const { user }: CurrentUser = useCurrentUser();

  return (
    <Screen title="Profil">
      <LegacyCard>{user ? <Profile user={user} /> : <SignInForm />}</LegacyCard>
    </Screen>
  );
}
