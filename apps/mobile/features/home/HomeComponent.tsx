import Button from '@/components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { View, Image } from 'react-native';

export default function HomeComponent() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-transparent justify-center items-center mb-15 gap-6">
      <Image
        source={require('../../assets/images/logo.png')}
        className="mb-6"
      />
      <View className="flex flex-col w-full items-center justify-between gap-4">
        <Button
          variant="primary"
          label="CONNEXION"
          className="w-[70%] h-14 font-bold"
        />
        <Button
          variant="primary"
          label="INSCRIPTION"
          className="w-[70%] h-14"
        />
        <Button
          variant="default"
          label="Jouer sans compte"
          className="w-[70%] h-14"
          onPress={() => router.navigate('/(tabs)/play')}
        />
      </View>
    </View>
  );
}
