import {
  type ServerReachability,
  useServerReachability,
} from '@cityborn/client/health';
import { colors } from '@cityborn/design-system';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';

function BackendUnreachableDialog() {
  const { isServerUnreachable, recheckServerReachability }: ServerReachability =
    useServerReachability();

  return (
    <Dialog
      visible={isServerUnreachable}
      onClose={() => {}}
      className="h-auto py-8 px-6"
    >
      <View className="flex justify-center items-center gap-4">
        <Icon name="alert_fill" size={40} color={colors.destructive[500]} />
        <Text className="text-lg text-center">
          Connexion au serveur impossible. Vérifie ta connexion internet et
          réessaie.
        </Text>
        <Button label="Réessayer" onPress={recheckServerReachability} />
      </View>
    </Dialog>
  );
}

export default BackendUnreachableDialog;
