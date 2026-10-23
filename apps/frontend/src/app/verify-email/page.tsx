import { Suspense } from 'react';
import CenteredPageCard from '@/components/ui/cards/CenteredPageCard';
import { VerifyEmail } from '@/features/auth/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <CenteredPageCard>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </CenteredPageCard>
  );
}
