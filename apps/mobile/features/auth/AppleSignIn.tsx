import { useError } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import type { AppleAuthenticationCredential } from 'expo-apple-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import { CodedError } from 'expo-modules-core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/classNames';

export const SignInWithAppleButton = () => {
  const { invokeError } = useError();
  const router = useRouter();
  const { signInWithApple }: IdentityProviderSignIn = useIdentityProviderSignIn(
    {
      onSignedIn: () => router.dismissTo('/'),
    },
  );
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        invokeError("Apple n'a pas fourni de jeton d'identité.");
        return;
      }

      const userDetails = extractAppleUserDetails(credential);

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
      throw error;
    }

    invokeError(error, 'La connexion avec Apple a échoué.');
  }

  type AppleUserDetails = {
    email: string;
    family_name: string;
    given_name: string;
  };

  const handlePress = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View className={cn(isLoading ? 'opacity-50' : 'opacity-100')}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
        }
        cornerRadius={100}
        style={{ width: 190, height: 42 }}
        onPress={handlePress}
      />
    </View>
  );
};
