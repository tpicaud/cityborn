'use client';

import {
  useVerificationEmailResend,
  type VerificationEmailResend,
} from '@cityborn/client/auth';
import LoadingButton from '@/components/ui/buttons/LoadingButton';

export function EmailVerificationNotice() {
  const verificationEmailResend: VerificationEmailResend =
    useVerificationEmailResend();

  return (
    <div className="flex flex-col items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-center w-full max-w-xs">
      <p className="text-sm font-medium text-amber-900">
        Votre adresse e-mail n'est pas vérifiée
      </p>
      <LoadingButton
        variant="text"
        color="warning"
        size="small"
        className="normal-case underline"
        onClick={verificationEmailResend.resend}
        disabled={verificationEmailResend.isSent}
      >
        {verificationEmailResend.isSent
          ? 'E-mail de vérification envoyé'
          : 'Renvoyer un e-mail de vérification'}
      </LoadingButton>
    </div>
  );
}
