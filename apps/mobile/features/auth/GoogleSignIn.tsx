import { UserFacingError } from '@cityborn/api';
import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  GoogleOneTapSignIn,
  GoogleSignInButton,
  isCancelledResponse,
  isSuccessResponse,
  type OneTapResponse,
} from 'react-native-nitro-google-signin';
import { mobileClientConfig } from '@/config/client';

GoogleOneTapSignIn.configure({
  webClientId: mobileClientConfig.googleOAuthWebClientId,
  iosClientId: mobileClientConfig.googleOAuthIosClientId,
});

export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleOneTapSignIn.signOut();
  } catch {
    return;
  }
}

export const SignInWithGoogleButton = () => {
  const { reportError }: ErrorReporter = useErrorReporter();
  const router = useRouter();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      onSignedIn: () => router.dismissTo('/'),
    });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signIn = async (): Promise<void> => {
    try {
      await GoogleOneTapSignIn.checkPlayServices();
      const response: OneTapResponse =
        await GoogleOneTapSignIn.presentExplicitSignIn();

      if (isCancelledResponse(response)) return;

      if (!isSuccessResponse(response)) {
        reportError(
          new UserFacingError("Google n'a pas fourni de jeton d'identité."),
        );
        return;
      }

      await signInWithGoogle({ idToken: response.data.idToken });
    } catch (error: unknown) {
      reportError(error, 'La connexion avec Google a échoué.');
    }
  };

  const handlePress = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signIn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleSignInButton
      signInBehavior="none"
      onPress={handlePress}
      disabled={isLoading}
      colorScheme="light"
      size="wide"
    />
  );
};
