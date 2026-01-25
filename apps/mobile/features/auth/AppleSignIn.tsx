import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { View } from 'react-native';

export const SignInWithAppleButton = () => {
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

      apiClient.signInWithApple(
        credential.user,
        credential.email || '',
        credential.fullName?.familyName || '',
        credential.fullName?.givenName || '',
      );
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign in canceled by user');
      } else {
        console.error(e);
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
