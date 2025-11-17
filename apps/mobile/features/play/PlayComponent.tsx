import Button from '@/components/ui/Button';
import { useState } from 'react';
import { TextInput, View, Text } from 'react-native';

export default function PlayComponent() {
  const [joinCode, setJoinCode] = useState('');

  return (
    <View className="flex-1">
      <View className="flex-1 justify-center items-center gap-20">
        <View className="flex justify-center items-center gap-4">
          <Text className="text-2xl">Rejoindre</Text>
          <View className="flex flex-row w-[65%] h-12">
            <TextInput
              value={joinCode}
              placeholder="Entrez le code"
              onChangeText={(text) => setJoinCode(text)}
              className="flex-1 rounded-l-full pl-3 border-1"
            />
            <Button
              variant="primary"
              label="GO"
              className="w-16 rounded-l-none h-full"
            />
          </View>
        </View>
        <View className="flex w-full justify-center items-center gap-4">
          <Text className="text-2xl">Créer</Text>
          <View className="flex flex-col w-full items-center gap-4">
            <Button variant="primary" label="SOLO" className="w-[70%] h-14" />
            <Button variant="primary" label="MULTI" className="w-[70%] h-14" />
          </View>
        </View>
      </View>
    </View>
  );
}
