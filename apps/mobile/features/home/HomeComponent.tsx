import Button from '@/components/ui/Button';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';

export default function HomeComponent() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  return (
    <View className="flex-1">
      <View className=" flex-1 flex flex-col justify-center items-center gap-6">
        <Image
          source={require('../../assets/images/logo.png')}
          className="mb-6"
        />
        {user ? (
          <View className="flex flex-col justify-center items-center gap-6">
            <Text className="text-3xl">
              Bienvenue <Text className="font-bold">{user.username}</Text>
            </Text>
            <Button
              color="primary"
              variant="filled"
              label="JOUER"
              size="large"
              onPress={() => router.navigate('/(tabs)/play')}
            />
            <Button
              variant="default"
              label="Déconnexion"
              onPress={async () => {
                await apiClient.signOut();
                setUser(null);
              }}
            />
          </View>
        ) : (
          <View className="flex flex-col w-full items-center justify-between gap-4">
            <Button
              color="primary"
              variant="outlined"
              label="CONNEXION"
              size="large"
              onPress={() => router.navigate('/auth/sign-in')}
            />
            <Button
              color="primary"
              variant="filled"
              label="INSCRIPTION"
              size="large"
              onPress={() => router.navigate('/auth/sign-up')}
            />
            <Button
              variant="default"
              label="Jouer sans compte"
              onPress={() => router.navigate('/(tabs)/play')}
            />
          </View>
        )}
      </View>
    </View>
  );
}
