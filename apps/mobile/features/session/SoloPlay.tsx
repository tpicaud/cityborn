import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionLauncher,
  useSessionLauncher,
} from '@cityborn/client/session';
import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { useNavigation } from '@/lib/navigation';

export default function SoloPlay() {
  const navigation: Navigation = useNavigation();
  const { playSolo }: SessionLauncher = useSessionLauncher({ navigation });

  return (
    <View className="flex-1 w-70 self-center">
      <View className="flex-1 justify-center items-center gap-4">
        <Text className="text-2xl">Créer</Text>
        <Button
          color="primary"
          variant="filled"
          label="SOLO"
          size="large"
          onPress={playSolo}
        />
      </View>
    </View>
  );
}
