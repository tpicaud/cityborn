import ProfileComponent from '@/features/profile/ProfileComponent';
import { User } from '@cityborn/types';
import { Text, View } from 'react-native';

export default function ProfilePage() {
  const user: User | null = null;

  return (
    <View className="flex-1">
      <ProfileComponent />
    </View>
  );
}
