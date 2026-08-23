import { colors } from '@cityborn/design-system';
import Button from './Button';
import Dialog from './Dialog';
import { Icon } from './Icon';
import { Text, View } from './native/NativeComponents';

interface BackendUnreachableDialogProps {
  visible: boolean;
  onRetry: () => Promise<void>;
}

function BackendUnreachableDialog({
  visible,
  onRetry,
}: BackendUnreachableDialogProps) {
  return (
    <Dialog visible={visible} onClose={() => {}} className="h-auto py-8 px-6">
      <View className="flex justify-center items-center gap-4">
        <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
        <Text className="text-lg text-center">
          Connexion au serveur impossible. Vérifie ta connexion internet et
          réessaie.
        </Text>
        <Button label="Réessayer" onPress={onRetry} />
      </View>
    </Dialog>
  );
}

export default BackendUnreachableDialog;
