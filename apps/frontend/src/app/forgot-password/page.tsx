import CenteredPageCard from '@/components/ui/cards/CenteredPageCard';
import { ForgotPasswordForm } from '@/features/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <CenteredPageCard>
      <ForgotPasswordForm />
    </CenteredPageCard>
  );
}
