import Button from '@/components/ui/Button';
import { useAuth } from '@cityborn/contexts';
import { Link, useRouter } from 'expo-router';
import { View, Image, Text } from 'react-native';

export default function HomeComponent() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View className="flex-1 bg-transparent">
      {user ? (
        <View className="flex flex-col justify-center items-center">
          <Text>Bienvenue {user.username}</Text>
        </View>
      ) : (
        <View className=" flex-1 flex flex-col justify-center items-center mb-15 gap-6">
          <Image
            source={require('../../assets/images/logo.png')}
            className="mb-6"
          />
          <View className="flex flex-col w-full items-center justify-between gap-4">
            <Button
              color="primary"
              variant="outlined"
              label="CONNEXION"
              size="large"
              onPress={() => router.navigate('/sign-in/sign-in')}
            />
            <Button
              color="primary"
              variant="filled"
              label="INSCRIPTION"
              size="large"
            />
            <Button
              variant="default"
              label="Jouer sans compte"
              onPress={() => router.navigate('/(tabs)/play')}
            />
          </View>
        </View>
      )}
    </View>
  );
}
