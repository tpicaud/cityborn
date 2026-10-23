import {
  formatSessionCodeInput,
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import { Controller } from 'react-hook-form';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import TextInput from '@/components/ui/TextInput';
import { useNavigation } from '@/lib/navigation';

export default function Play() {
  const navigation = useNavigation();
  const {
    joinSessionForm: {
      control,
      formState: { errors, isSubmitting },
    },
    playSolo,
    playMulti,
    joinSession,
  }: SessionLauncher = useSessionLauncher({ navigation });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 w-70 self-center">
        <View className="flex-1 justify-center items-center gap-10">
          <View className="h-[45%] flex justify-end items-center gap-4">
            <Text className="text-2xl">Rejoindre</Text>
            <View className="flex flex-row w-50 h-12">
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    placeholder="Entrez le code"
                    onChangeText={(sessionCodeInput: string) =>
                      onChange(formatSessionCodeInput(sessionCodeInput))
                    }
                    onBlur={onBlur}
                    className="flex-1 rounded-r-none pl-3 h-full border"
                    keyboardType="number-pad"
                    error={!!errors.code}
                  />
                )}
              />
              <Button
                color="primary"
                variant="filled"
                label="GO"
                className="w-16 rounded-l-none h-full border border-primary-500"
                disabled={isSubmitting}
                onPress={joinSession}
              />
            </View>
            {errors.code && (
              <Text className="text-xs text-destructive-500">
                {errors.code.message}
              </Text>
            )}
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
                onPress={playSolo}
              />
              <Button
                color="primary"
                variant="filled"
                label="MULTI"
                size="large"
                onPress={playMulti}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
