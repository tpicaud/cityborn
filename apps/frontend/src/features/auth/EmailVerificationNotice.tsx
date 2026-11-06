'use client';

import {
  useVerificationEmailResend,
  type VerificationEmailResend,
} from '@cityborn/client/auth';
import { Button, FormText, Panel } from '@cityborn/design-system';

export function EmailVerificationNotice() {
  const { resend, isSending, isSent }: VerificationEmailResend =
    useVerificationEmailResend();
  return (
    <Panel disableOptimization p="4" gap="3" w="100%">
      <FormText disableOptimization>
        Ton adresse e-mail n’est pas vérifiée
      </FormText>
      <Button
        compact
        label={
          isSent
            ? 'E-mail de vérification envoyé'
            : 'Renvoyer un e-mail de vérification'
        }
        variant="outline"
        onPress={resend}
        disabled={isSent}
        loading={isSending}
      />
    </Panel>
  );
}
