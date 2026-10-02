import { useError } from '@cityborn/client';
import {
  type IdentityProviderSignIn,
  useIdentityProviderSignIn,
} from '@cityborn/client/auth';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable } from 'react-native';
import { mobileClientConfig } from '@/config/client';
import { authApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

GoogleSignin.configure({
  webClientId: mobileClientConfig.googleOAuthWebClientId,
  iosClientId: mobileClientConfig.googleOAuthIosClientId,
});

export const SignInWithGoogleButton = () => {
  const { invokeError } = useError();
  const router = useRouter();
  const { signInWithGoogle }: IdentityProviderSignIn =
    useIdentityProviderSignIn({
      authApi,
      onSignedIn: () => router.dismissTo('/'),
    });
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userInfo = response.data;
        const idToken = userInfo.idToken;
        if (!idToken) return;

        await signInWithGoogle({ idToken });
      }
    } catch (error: unknown) {
      invokeError(error, 'La connexion avec Google a échoué.');
    }
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
    <Pressable
      onPress={handlePress}
      disabled={isLoading}
      className={cn(isLoading ? 'opacity-50' : 'opacity-100')}
    >
      <Image
        source={require('../../assets/images/google/android_light_rd_ctn.png')}
        resizeMode="contain"
      />
    </Pressable>
  );
};
