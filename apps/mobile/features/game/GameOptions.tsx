import {
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { View } from '@/components/ui/native/NativeComponents';

type GameOptionsProps = {
  handleLeaveGame: () => Promise<void>;
};

const BACK_ACTION_TYPES: string[] = ['GO_BACK', 'POP'];

function useBackInterception(onBack: () => void): void {
  const navigation = useNavigation();

  usePreventRemove(true, ({ data }) => {
    if (BACK_ACTION_TYPES.includes(data.action.type)) {
      onBack();
      return;
    }
    navigation.dispatch(data.action);
  });
}

export function GameOptions({ handleLeaveGame }: GameOptionsProps) {
  const insets = useSafeAreaInsets();
  const optionsMenu: GameOptionsMenu = useGameOptionsMenu({
    leaveGame: handleLeaveGame,
  });
  useBackInterception(optionsMenu.open);

  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: insets.top + 72,
          left: 16,
          zIndex: 30,
        }}
      >
        <Button label="Options" onPress={optionsMenu.open} />
      </View>

      <Dialog
        visible={optionsMenu.step !== 'closed'}
        onClose={
          optionsMenu.step === 'options'
            ? optionsMenu.resume
            : optionsMenu.cancelLeave
        }
        title={optionsMenu.step === 'options' ? 'Options' : undefined}
        message={
          optionsMenu.step === 'leaveConfirmation'
            ? 'Quitter la partie ? Ta progression sera perdue.'
            : undefined
        }
        className="h-auto"
      >
        {optionsMenu.step === 'leaveConfirmation' ? (
          <View className="flex-row gap-3">
            <Button
              label="Annuler"
              variant="outlined"
              onPress={optionsMenu.cancelLeave}
            />
            <Button
              label="Quitter"
              color="destructive"
              onPress={optionsMenu.confirmLeave}
            />
          </View>
        ) : (
          <View className="w-full gap-3">
            <Button
              size="medium"
              label="Reprendre"
              onPress={optionsMenu.resume}
            />
            <Button
              size="medium"
              label="Quitter"
              variant="outlined"
              color="destructive"
              onPress={optionsMenu.requestLeave}
            />
          </View>
        )}
      </Dialog>
    </>
  );
}
