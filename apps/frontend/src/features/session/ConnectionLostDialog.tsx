'use client';

import { BodyText, Button, Popup } from '@cityborn/design-system';
import { View } from 'tamagui';

type ConnectionLostDialogProps = {
  onRetry: () => void;
  onExit: () => void;
};

export function ConnectionLostDialog({
  onRetry,
  onExit,
}: ConnectionLostDialogProps) {
  return (
    <Popup open title="Connexion perdue">
      <View gap="4">
        <BodyText>Connexion à la session perdue</BodyText>
        <Button compact label="Réessayer" onPress={onRetry} />
        <Button variant="outline" label="Quitter" onPress={onExit} />
      </View>
    </Popup>
  );
}
