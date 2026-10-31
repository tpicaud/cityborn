import { type CurrentUser, useCurrentUser } from '@cityborn/client/auth';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import { SignInForm } from '@/features/auth/SignInForm';
import { LegalLinks } from '@/features/legal-information/LegalLinks';
import Profile from '@/features/profile/Profile';

export default function ProfileScreen() {
  const { user }: CurrentUser = useCurrentUser();

  return (
    <Screen title="Profil">
      <LegacyCard>
        {user ? <Profile user={user} /> : <SignInForm />}
        <LegalLinks />
      </LegacyCard>
    </Screen>
  );
}
