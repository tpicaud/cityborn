'use client';

import type { GameOptionsMenu } from '@cityborn/client/game';
import { BodyText, Button, Popup } from '@cityborn/design-system';
import { useEffect } from 'react';
import { View } from 'tamagui';

type GameOptionsProps = {
  optionsMenu: GameOptionsMenu;
};

function useBrowserBackInterception(onBack: () => void): void {
  useEffect(() => {
    window.history.pushState(window.history.state, '', window.location.href);
    const handlePopState: () => void = () => {
      window.history.pushState(window.history.state, '', window.location.href);
      onBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);
}

export function GameOptions({ optionsMenu }: GameOptionsProps) {
  useBrowserBackInterception(optionsMenu.open);

  return (
    <>
      <Popup
        open={optionsMenu.step === 'options'}
        onClose={optionsMenu.resume}
        title="Options"
      >
        <View gap="4">
          <Button compact label="Reprendre" onPress={optionsMenu.resume} />
          <Button compact label="Quitter" onPress={optionsMenu.requestLeave} />
        </View>
      </Popup>
      <Popup
        open={optionsMenu.step === 'leaveConfirmation'}
        onClose={optionsMenu.cancelLeave}
        title="Quitter la partie ?"
      >
        <View gap="4">
          <BodyText>Ta progression sera perdue.</BodyText>
          <Button compact label="Quitter" onPress={optionsMenu.confirmLeave} />
          <Button
            variant="outline"
            label="Annuler"
            onPress={optionsMenu.cancelLeave}
          />
        </View>
      </Popup>
    </>
  );
}
