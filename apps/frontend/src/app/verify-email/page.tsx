import { Suspense } from 'react';
import { VerifyEmailComponent } from '@/components/auth/VerifyEmailComponent';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailComponent />
    </Suspense>
  );
}
