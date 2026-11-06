'use client';

import {
  type EmailVerification,
  useEmailVerification,
} from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { Button, FormText } from '@cityborn/design-system';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { Spinner, View } from 'tamagui';
import { useNavigation } from '@/lib/navigation';
import { AuthScreen } from './AuthScreen';

export function VerifyEmail() {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const verificationToken: string =
    searchParams.get('verification_token') ?? searchParams.get('token') ?? '';
  const navigation: Navigation = useNavigation();
  const { status, renew }: EmailVerification = useEmailVerification({
    verificationToken,
  });
  const content: { title: string; message: string } = {
    verifying: {
      title: 'Vérification',
      message: 'Validation de ton adresse e-mail en cours…',
    },
    verified: {
      title: 'E-mail vérifié',
      message: 'Ton adresse e-mail est maintenant vérifiée.',
    },
    expired: {
      title: 'Lien expiré',
      message:
        'Ce lien a expiré. Demande un nouveau lien pour vérifier ton adresse e-mail.',
    },
    invalid: {
      title: 'Vérification impossible',
      message: 'Le lien de vérification est invalide ou a déjà été utilisé.',
    },
    renewed: {
      title: 'Vérifie tes e-mails',
      message: 'Un nouveau lien de vérification vient de t’être envoyé.',
    },
  }[status];
  return (
    <AuthScreen title={content.title} bottomSafeArea>
      <View disableOptimization gap="4" role="status">
        {status === 'verifying' && <Spinner color="white" />}
        <FormText disableOptimization>{content.message}</FormText>
        {status === 'expired' && (
          <Button compact label="Renvoyer un lien" onPress={renew} />
        )}
        {status !== 'verifying' && (
          <Button
            compact
            label="Retour à l’accueil"
            variant="secondary"
            onPress={() => navigation.returnTo('/')}
          />
        )}
      </View>
    </AuthScreen>
  );
}
