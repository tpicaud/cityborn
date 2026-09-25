import type { Metadata } from 'next';
import { ResetPasswordComponent } from '@/features/auth/ResetPasswordComponent';

export const metadata: Metadata = {
  title: 'Réinitialiser son mot de passe',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return <ResetPasswordComponent />;
}
