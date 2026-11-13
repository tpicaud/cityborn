import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { GoogleSignInButton } from 'react-native-nitro-google-signin';
import { requestGoogleIdToken } from '@/lib/googleSignIn';
import { GoogleEmailVerification } from './GoogleEmailVerification';

export function SignInWithGoogleButton() {
  const { reportError }: ErrorReporter = useErrorReporter();
  const router = useRouter();
  const flow: IdentityProviderSignIn = useIdentityProviderSignIn({
    onSignedIn: () => router.dismissTo('/'),
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const idToken: string | null = await requestGoogleIdToken();
      if (idToken) await flow.signInWithGoogle({ idToken });
    } catch (error: unknown) {
      reportError(error, 'La connexion avec Google a échoué.');
    } finally {
      setIsLoading(false);
    }
  };

  if (flow.googleEmailVerificationRequired)
    return <GoogleEmailVerification flow={flow} />;

  return (
    <GoogleSignInButton
      size="standard"
      colorScheme="light"
      disabled={isLoading}
      signInBehavior="none"
      onPress={signIn}
      loading={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Continuer avec Google"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    />
  );
}
