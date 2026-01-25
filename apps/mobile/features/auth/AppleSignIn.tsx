import * as AppleAuthentication from 'expo-apple-authentication';
import { View } from 'react-native';

export const SignInWithAppleButton = () => {
  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
        }
        cornerRadius={100}
        style={{ width: 190, height: 42 }}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
            // signed in
          } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
    </View>
  );
};
