import type { Navigation } from '@cityborn/client/platform';
import { Screen } from '@cityborn/design-system';
import { LegacyCard } from '@/components/ui/LegacyCard';
import { SignUpForm } from '@/features/auth/SignUpForm';
import { useNavigation } from '@/lib/navigation';

export default function SignUpScreen() {
  const navigation: Navigation = useNavigation();

  return (
    <Screen onBack={navigation.back}>
      <LegacyCard>
        <SignUpForm />
      </LegacyCard>
    </Screen>
  );
}
