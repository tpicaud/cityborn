import ScreenLayout from '@/components/ScreenLayout';
import { SignInForm } from '@/features/auth/SignInForm';

export default function SignInScreen() {
  return (
    <ScreenLayout>
      <SignInForm />
    </ScreenLayout>
  );
}
