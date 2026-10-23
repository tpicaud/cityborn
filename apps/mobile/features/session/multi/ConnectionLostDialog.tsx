import Button from '@/components/ui/Button';
import { Text, View } from '@/components/ui/native/NativeComponents';

type ConnectionLostDialogProps = {
  onRetry: () => void;
  onExit: () => void;
};

export function ConnectionLostDialog({
  onRetry,
  onExit,
}: ConnectionLostDialogProps) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/30">
      <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
        <Text className="text-center">Connexion à la session perdue</Text>
        <View className="flex-row gap-3">
          <Button label="Quitter" variant="outlined" onPress={onExit} />
          <Button label="Réessayer" onPress={onRetry} />
        </View>
      </View>
    </View>
  );
}
