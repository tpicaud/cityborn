import { UserFacingError } from '@cityborn/api';
import { type ErrorReporter, useErrorReporter } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import { BrandedButton } from '@cityborn/design-system';
import type { AppleAuthenticationCredential } from 'expo-apple-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import { CodedError } from 'expo-modules-core';
import { useRouter } from 'expo-router';

export const SignInWithAppleButton = () => {
  const { reportError }: ErrorReporter = useErrorReporter();
  const router: ReturnType<typeof useRouter> = useRouter();
  const { signInWithApple }: IdentityProviderSignIn = useIdentityProviderSignIn(
    {
      onSignedIn: () => router.dismissTo('/'),
    },
  );

  const signIn = async (): Promise<void> => {
    try {
      const credential: AppleAuthenticationCredential =
        await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

      if (!credential.identityToken) {
        reportError(
          new UserFacingError("Apple n'a pas fourni de jeton d'identité."),
        );
        return;
      }

      const userDetails: AppleUserDetails | undefined =
        extractAppleUserDetails(credential);

      await signInWithApple({
        identity_token: credential.identityToken,
        apple_user_id: credential.user,
        details: userDetails,
      });
    } catch (e) {
      handleAppleSignInError(e);
    }
  };

  function extractAppleUserDetails(
    credential: AppleAuthenticationCredential,
  ): AppleUserDetails | undefined {
    const { email, fullName } = credential;

    if (!email || !fullName?.familyName || !fullName?.givenName) {
      return undefined;
    }

    return {
      email,
      family_name: fullName.familyName,
      given_name: fullName.givenName,
    };
  }

  function handleAppleSignInError(error: unknown): void {
    if (error instanceof CodedError && error.code === 'ERR_REQUEST_CANCELED') {
      return;
    }

    reportError(error, 'La connexion avec Apple a échoué.');
  }

  type AppleUserDetails = {
    email: string;
    family_name: string;
    given_name: string;
  };

  return (
    <BrandedButton
      label="Continuer avec Apple"
      icon="providers/apple"
      onPress={signIn}
    />
  );
};
