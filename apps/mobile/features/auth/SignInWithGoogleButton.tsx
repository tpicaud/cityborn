import { UserFacingError } from '@cityborn/api';
import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { BrandedButton } from '@cityborn/design-system';
import { useRouter } from 'expo-router';
import {
  GoogleOneTapSignIn,
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

export function SignInWithGoogleButton() {
  const { reportError }: ErrorReporter = useErrorReporter();
  const router: ReturnType<typeof useRouter> = useRouter();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      onSignedIn: () => router.dismissTo('/'),
    });

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

  return (
    <BrandedButton
      label="Continuer avec Google"
      icon="providers/google"
      onPress={signIn}
    />
  );
}
