import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Réinitialiser son mot de passe | Cityborn',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <ResetPasswordForm />
    </div>
  );
}
