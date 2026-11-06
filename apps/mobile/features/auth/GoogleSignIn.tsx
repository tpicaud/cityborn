import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { BrandedButton } from '@cityborn/design-system';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  type SignInResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { mobileClientConfig } from '@/config/client';

GoogleSignin.configure({
  webClientId: mobileClientConfig.googleOAuthWebClientId,
  iosClientId: mobileClientConfig.googleOAuthIosClientId,
});

export const SignInWithGoogleButton = () => {
  const { reportError }: ErrorReporter = useErrorReporter();
  const router: ReturnType<typeof useRouter> = useRouter();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      onSignedIn: () => router.dismissTo('/'),
    });

  const signIn = async (): Promise<void> => {
    try {
      await GoogleSignin.hasPlayServices();
      const response: SignInResponse = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) return;

      if (isSuccessResponse(response)) {
        const idToken: string | null = response.data.idToken;
        if (!idToken) return;

        await signInWithGoogle({ idToken });
      }
    } catch (error: unknown) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      )
        return;
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
};
