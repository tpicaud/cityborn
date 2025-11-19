import View from '@/components/ui/View';
import { SignInComponent } from '@/features/auth/SignInComponent';

export default function SignInScreen() {
  return (
    <View className="flex-1">
      <SignInComponent />
    </View>
  );
}
