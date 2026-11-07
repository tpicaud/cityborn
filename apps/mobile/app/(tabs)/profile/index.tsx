import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import { EmailVerificationNotice } from '@/features/auth/EmailVerificationNotice';
import { SignInForm } from '@/features/auth/SignInForm';
import { LegalLinks } from '@/features/legal-information/LegalLinks';
import Profile from '@/features/profile/Profile';

export default function ProfileScreen() {
  const { user }: CurrentUser = useCurrentUser();

  if (!user) return <SignInForm />;

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
