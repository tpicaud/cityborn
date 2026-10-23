import { Suspense } from 'react';
import CenteredPageCard from '@/components/ui/cards/CenteredPageCard';
import { ResetPasswordForm } from '@/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <CenteredPageCard>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </CenteredPageCard>
  );
}
