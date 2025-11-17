import { User } from '@cityborn/types';
import { View, Text } from 'react-native';

export default function ProfileComponent() {
  const user: User | null = null;
  return (
    <View className="flex-1 flex flex-col justify-center items-center">
      {!user ? (
        <Text className="text-2xl">Tu n'es pas connecté !</Text>
      ) : (
        <Text>Bienvenue !</Text>
      )}
    </View>
  );
}
