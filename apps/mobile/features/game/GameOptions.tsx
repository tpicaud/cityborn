import type { GameOptionsMenu } from '@cityborn/client/game';
import { BodyText, Button, Popup } from '@cityborn/design-system';
import { useNavigation } from 'expo-router';
import {
  type NavigationProp,
  usePreventRemove,
} from 'expo-router/react-navigation';
import { View } from 'tamagui';

type GameOptionsProps = {
  optionsMenu: GameOptionsMenu;
};

const BACK_ACTION_TYPES: string[] = ['GO_BACK', 'POP'];

function useBackInterception(onBack: () => void): void {
  const navigation: NavigationProp<ReactNavigation.RootParamList> =
    useNavigation();

  usePreventRemove(true, ({ data }) => {
    if (BACK_ACTION_TYPES.includes(data.action.type)) {
      onBack();
      return;
    }
    navigation.dispatch(data.action);
  });
}

export function GameOptions({ optionsMenu }: GameOptionsProps) {
  useBackInterception(optionsMenu.open);

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
