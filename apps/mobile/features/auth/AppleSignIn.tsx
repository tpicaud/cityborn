import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@cityborn/contexts';
import { ApiError, ErrorCode } from '@cityborn/errors';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

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
      console.log(credential);

      let user_details:
        | {
            email: string;
            family_name: string;
            given_name: string;
          }
        | undefined = undefined;

      if (
        credential.email &&
        credential.fullName &&
        credential.fullName.familyName &&
        credential.fullName.givenName
      ) {
        user_details = {
          email: credential.email,
          family_name: credential.fullName.familyName,
          given_name: credential.fullName.givenName,
        };
      }

      const user = await apiClient.signInWithApple(
        credential.user,
        user_details,
      );

      setUser(user);
      router.push('/');
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign in canceled by user');
      } else {
        console.error(e);
        throw new ApiError(
          ErrorCode.USER_INVALID_CREDENTIALS,
          'Google sign in failed',
          401,
        );
      }
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
