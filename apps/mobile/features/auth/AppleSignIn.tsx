import { useAuth } from '@cityborn/contexts';
import { ApiError, ErrorCode } from '@cityborn/errors';
import type { AppleAuthenticationCredential } from 'expo-apple-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { apiClient } from '@/lib/apiClient';
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

      // Validation : identityToken est requis
      if (!credential.identityToken) {
        throw new ApiError(
          ErrorCode.USER_INVALID_CREDENTIALS,
          'Apple did not provide an identity token',
          401,
        );
      }

      // Extraire les détails utilisateur (seulement première connexion)
      const userDetails = extractAppleUserDetails(credential);

      // Authentification via l'API
      const user = await apiClient.signInWithApple(
        credential.identityToken,
        credential.user,
        userDetails,
      );

      setUser(user);
      router.push('/');
    } catch (e: any) {
      handleAppleSignInError(e);
    }
  };

  // Fonction helper pour extraire les détails utilisateur
  function extractAppleUserDetails(
    credential: AppleAuthenticationCredential,
  ): AppleUserDetails | undefined {
    const { email, fullName } = credential;

    // Retourner undefined si les infos sont incomplètes
    if (!email || !fullName?.familyName || !fullName?.givenName) {
      return undefined;
    }

    return {
      email,
      family_name: fullName.familyName,
      given_name: fullName.givenName,
    };
  }

  // Fonction helper pour la gestion d'erreur
  function handleAppleSignInError(error: any): never {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // L'utilisateur a annulé - ne pas afficher d'erreur
      console.log('Apple sign in canceled by user');
      throw error; // Ou return si tu veux gérer différemment
    }

    console.error('Apple sign in error:', error);

    // Si c'est déjà une ApiError, la relancer
    if (error instanceof ApiError) {
      throw error;
    }

    // Sinon, créer une nouvelle ApiError
    throw new ApiError(
      ErrorCode.USER_INVALID_CREDENTIALS,
      'Apple sign in failed',
      401,
    );
  }

  // Types
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
