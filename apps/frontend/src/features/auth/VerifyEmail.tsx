'use client';

import {
  type EmailVerification,
  useEmailVerification,
} from '@cityborn/client/auth';
import type { Navigation } from '@cityborn/client/platform';
import { BodyText, Button } from '@cityborn/design-system';
import { type ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import { Spinner, View } from 'tamagui';
import { useNavigation } from '@/lib/navigation';
import { AuthScreen } from './AuthScreen';

export function VerifyEmail() {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const verificationToken: string =
    searchParams.get('verification_token') ?? searchParams.get('token') ?? '';
  const navigation: Navigation = useNavigation();
  const { content, renew }: EmailVerification = useEmailVerification({
    verificationToken,
  });
  return (
    <AuthScreen title={content.title} bottomSafeArea>
      <View disableOptimization gap="4" role="status">
        {content.pending && <Spinner color="white" />}
        <BodyText disableOptimization>{content.message}</BodyText>
        {content.renewable && (
          <Button compact label="Renvoyer un lien" onPress={renew} />
        )}
        {!content.pending && (
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
