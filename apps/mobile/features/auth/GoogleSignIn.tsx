import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@cityborn/contexts';
import { ApiError, ErrorCode } from '@cityborn/errors';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Image } from 'react-native';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});

export const SignInWithGoogleButton = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const userInfo = response.data;
        const idToken = userInfo.idToken;
        if (!idToken) return;

        const user = await apiClient.signInWithGoogle(idToken);

        setUser(user);
        router.push('/');
      } else {
        console.log('Google sign in modal closed by user');
      }
    } catch (error) {
      console.error(error);
      throw new ApiError(
        ErrorCode.USER_INVALID_CREDENTIALS,
        'Google sign in failed',
        401,
      );
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
