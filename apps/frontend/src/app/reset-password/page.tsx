import type { Metadata } from 'next';
import { ResetPasswordComponent } from '@/features/auth/ResetPasswordComponent';

export const metadata: Metadata = {
  title: 'Réinitialiser son mot de passe | Cityborn',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <ResetPasswordComponent />
    </main>
  );
}
