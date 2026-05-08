import { useAuth } from '@cityborn/contexts';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';

export default function Home() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  return (
    <View className="flex-1 w-70 self-center">
      <View className=" flex-1 flex flex-col justify-center items-center gap-6">
        <Image
          source={require('../../assets/images/logo.png')}
          resizeMode="contain"
          className="mb-6 rounded-xl w-40 h-40 md:w-48 md:h-48 lg:w-64 lg:h-64"
        />
        {user ? (
          <View className="flex flex-col justify-center items-center gap-8">
            <Text className="text-3xl text-center">
              Bienvenue <Text className="font-bold">{user.username}</Text>
            </Text>

            <View className="flex flex-col gap-6 items-center justify-center">
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
          </View>
        ) : (
          <View className="flex flex-col w-full items-center justify-between gap-6">
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
              label="Joue sans compte"
              onPress={() => router.navigate('/(tabs)/play')}
            />
          </View>
        )}
      </View>
    </View>
  );
}
