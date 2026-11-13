import {
  type ServerReachability,
  useServerReachability,
} from '@cityborn/client/health';
import { BodyText, Button, Popup } from '@cityborn/design-system';
import { View } from 'tamagui';

function BackendUnreachableDialog() {
  const { isServerUnreachable, recheckServerReachability }: ServerReachability =
    useServerReachability();

  return (
    <Popup open={isServerUnreachable} title="Serveur injoignable">
      <View gap="4">
        <BodyText>
          Oups, impossible de joindre le serveur. Vérifie ta connexion et on
          réessaie ?
        </BodyText>
        <Button compact label="Réessayer" onPress={recheckServerReachability} />
      </View>
    </Popup>
  );
}

export default BackendUnreachableDialog;
