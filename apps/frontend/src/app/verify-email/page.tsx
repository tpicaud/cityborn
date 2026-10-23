import { Suspense } from 'react';
import { VerifyEmail } from '@/features/auth/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
