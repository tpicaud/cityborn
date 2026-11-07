'use client';

import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/cards/LegacyCard';
import { EmailVerificationNotice } from '@/features/auth/EmailVerificationNotice';
import { SignInOrSignUp } from '@/features/auth/SignInOrSignUp';
import { LegalLinks } from '@/features/legal-information/LegalLinks';
import { Profile } from '@/features/profile/Profile';

export default function ProfilePage() {
  const { user }: CurrentUser = useCurrentUser();

  if (!user) return <SignInOrSignUp />;

  return (
    <Screen title="Profil">
      {user.isVerified === false && <EmailVerificationNotice />}
      <LegacyCard>
        <Profile user={user} />
        <LegalLinks />
      </LegacyCard>
    </Screen>
  );
}
