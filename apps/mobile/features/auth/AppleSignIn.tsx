import { ApiErrors, isApiError } from '@cityborn/api';
import { useAuth } from '@cityborn/client';
import type { AppleAuthenticationCredential } from 'expo-apple-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import { CodedError } from 'expo-modules-core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { signInWithApple } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export const SignInWithAppleButton = () => {
  const { setUser } = useAuth();
  const router = useRouter();
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
        throw ApiErrors.appleNoIdentityToken();
      }

      const userDetails = extractAppleUserDetails(credential);

      const result = await signInWithApple({
        identity_token: credential.identityToken,
        apple_user_id: credential.user,
        details: userDetails,
      });
      if (!result.ok) throw result.error;
      setUser(result.data);
      router.push('/');
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

  function handleAppleSignInError(error: unknown): never {
    if (error instanceof CodedError && error.code === 'ERR_REQUEST_CANCELED') {
      console.log('Apple sign in canceled by user');
      throw error;
    }

    console.error('Apple sign in error:', error);

    if (isApiError(error)) {
      throw error;
    }

    throw ApiErrors.appleSignInFailed();
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
