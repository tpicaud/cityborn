import { SignInComponent } from '@/features/auth/SignInComponent';
import { View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="flex-1">
      <SignInComponent />
    </View>
  );
}
