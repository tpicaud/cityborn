import Button from '@/components/ui/Button';
import { View, Text } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Play() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  return (
    <View className="flex-1">
      <View className="flex-1 justify-center items-center gap-20">
        <View className="flex justify-center items-center gap-4">
          <Text className="text-2xl">Rejoindre</Text>
          <View className="flex flex-row w-50 h-12">
            <TextInput
              value={joinCode}
              placeholder="Entrez le code"
              onChangeText={(text) => setJoinCode(text)}
              className="flex-1 rounded-r-none pl-3 border-1"
            />
            <Button
              color="primary"
              variant="filled"
              label="GO"
              className="w-16 rounded-l-none h-full border border-primary-500"
            />
          </View>
        </View>
        <View className="flex w-full justify-center items-center gap-4">
          <Text className="text-2xl">Créer</Text>
          <View className="flex flex-col w-full items-center gap-4">
            <Button
              color="primary"
              variant="filled"
              label="SOLO"
              size="large"
              onPress={() => router.navigate('/session/solo')}
            />
            <Button
              color="primary"
              variant="filled"
              label="MULTI"
              size="large"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
