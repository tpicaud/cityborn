import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@cityborn/contexts';
import { ApiError, ErrorCode } from '@cityborn/errors';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { Pressable, Image } from 'react-native';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});

export const SignInWithGoogleButton = () => {
  const { setUser } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) return;

      const idToken = response.data?.idToken;
      if (!idToken) return;

      const user = await apiClient.signInWithGoogle(idToken);

      setUser(user);
      router.push('/');
    } catch (error) {
      console.error(error);
      throw new ApiError(
        ErrorCode.USER_INVALID_CREDENTIALS,
        'Google sign in failed',
        401,
      );
    }
  };

  return (
    <Pressable onPress={handleSignIn}>
      <Image
        source={require('../../assets/images/google/android_light_rd_ctn@2x.png')}
        resizeMode="contain"
      />
    </Pressable>
  );
};
