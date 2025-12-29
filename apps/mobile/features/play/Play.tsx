import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { View, Text } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { apiClient } from '@/lib/apiClient';
import { useAuth, useError } from '@cityborn/contexts';
import { SessionMode } from '@cityborn/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

export default function Play() {
  const { user } = useAuth();
  const { invokeError } = useError();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [openConnectionAlert, setOpenConnectionAlert] = useState(false);

  const handleSoloPlay = () => {
    router.navigate('/session/solo');
  };

  const handleMultiPlay = async () => {
    if (!user) {
      setOpenConnectionAlert(true);
    } else {
      try {
        const session = await apiClient.createSession(SessionMode.MULTI);
        router.navigate(`/session/multi/${session.id}`);
      } catch (error: any) {
        invokeError(error);
      }
    }
  };

  const handleJoin = async () => {
    try {
      await apiClient.fetchSession(joinCode);
      router.push(`/session/multi/${joinCode}`);
    } catch (error: any) {
      invokeError(error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 w-70 self-center">
        <View className="flex-1 justify-center items-center gap-10">
          <View className="h-[45%] flex justify-end items-center gap-4">
            <Text className="text-2xl">Rejoindre</Text>
            <View className="flex flex-row w-50 h-12">
              <TextInput
                value={joinCode}
                placeholder="Entrez le code"
                onChangeText={(text) => setJoinCode(text)}
                className="flex-1 rounded-r-none pl-3 h-full border"
                keyboardType="numeric"
                maxLength={6}
              />
              <Button
                color="primary"
                variant="filled"
                label="GO"
                className="w-16 rounded-l-none h-full border border-primary-500"
                disabled={joinCode.length === 0}
                onPress={handleJoin}
              />
            </View>
          </View>

          <View className="flex flex-row items-center justify-center gap-2 w-full">
            <View className="flex-1  h-px bg-foreground" />
            <Text>OU</Text>
            <View className="flex-1 h-px bg-foreground" />
          </View>

          <View className="h-[45%] flex w-full justify-start items-center gap-4">
            <Text className="text-2xl">Créer</Text>
            <View className="flex flex-col w-full items-center gap-4">
              <Button
                color="primary"
                variant="filled"
                label="SOLO"
                size="large"
                onPress={handleSoloPlay}
              />
              <Button
                color="primary"
                variant="filled"
                label="MULTI"
                size="large"
                onPress={handleMultiPlay}
              />
            </View>
          </View>
        </View>

        {/* Connection dialog */}
        <Dialog
          visible={openConnectionAlert}
          onClose={() => setOpenConnectionAlert(false)}
          className="h-auto"
        >
          <View className="p-5">
            <Text className="text-center text-xl mb-6">
              Vous devez être connecté pour jouer en mode multi !
            </Text>
            <View className="flex flex-col gap-4 items-center justify-center w-min-full">
              <Button
                label="CONNEXION"
                size="medium"
                variant="outlined"
                onPress={() => router.navigate('/auth/sign-in')}
              />
              <Button
                label="INSCRIPTION"
                size="medium"
                variant="filled"
                onPress={() => router.navigate('/auth/sign-up')}
              />
            </View>
          </View>
        </Dialog>
      </View>
    </TouchableWithoutFeedback>
  );
}
