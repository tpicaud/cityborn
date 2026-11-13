import {
  useVerificationEmailResend,
  type VerificationEmailResend,
} from '@cityborn/client/auth';
import { BodyText, Button, Panel } from '@cityborn/design-system';

export function EmailVerificationNotice() {
  const { resend, isSending, isSent }: VerificationEmailResend =
    useVerificationEmailResend();
  return (
    <Panel notice>
      <BodyText>Ton adresse e-mail n’est pas vérifiée</BodyText>
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
