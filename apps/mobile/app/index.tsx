import Button from '@/components/ui/Button';
import { useState } from 'react';
import { View, Image, TextInput } from 'react-native';

export default function HomeScreen() {
  const [joinCode, setJoinCode] = useState('');

  return (
    <View className="flex-1 bg-zinc-100">
      <View className="flex-1 justify-center items-center mb-25 gap-6">
        <Image source={require('../assets/images/logo.png')} className="" />
        <View className="flex flex-row w-full items-center justify-between">
          <Button variant="primary" label="CONNEXION" className="w-[45%]" />
          <Button variant="primary" label="INSCRIPTION" className="w-[45%]" />
        </View>
        <View className="flex flex-row w-full gap-6">
          <TextInput
            value={joinCode}
            placeholder="Entrez le code"
            onChangeText={(text) => setJoinCode(text)}
            className="flex-1 border rounded-md"
          ></TextInput>
          <Button variant="primary" label="Rejoindre" />
        </View>

        <View className="flex flex-row w-full items-center justify-between">
          <Button variant="primary" label="SOLO" className="w-[45%]" />
          <Button variant="primary" label="MULTI" className="w-[45%]" />
        </View>
      </View>
    </View>
  );
}
