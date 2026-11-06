import {
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import { colors } from '@cityborn/design-system';
import { useNavigation } from 'expo-router';
import {
  type NavigationProp,
  usePreventRemove,
} from 'expo-router/react-navigation';
import { Pressable } from 'react-native';
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { View } from '@/components/ui/native/NativeComponents';
import { interceptBackAction } from './interceptBackAction';

type GameOptionsProps = {
  handleLeaveGame: () => Promise<void>;
};

function useBackInterception(onBack: () => void): void {
  const navigation: NavigationProp<ReactNavigation.RootParamList> =
    useNavigation();

  usePreventRemove(true, ({ data }) => {
    interceptBackAction({
      action: data.action,
      onBack,
      resume: navigation.dispatch,
    });
  });
}

export function GameOptions({ handleLeaveGame }: GameOptionsProps) {
  const insets: EdgeInsets = useSafeAreaInsets();
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
        <Pressable
          accessibilityLabel="Options"
          accessibilityRole="button"
          onPress={optionsMenu.open}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary-500"
        >
          <Icon
            name="settings_fill"
            size={24}
            color={colors.background.DEFAULT}
          />
        </Pressable>
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
          <View className="w-full flex-row gap-3">
            <Button
              label="Annuler"
              variant="outlined"
              className="w-auto flex-1"
              onPress={optionsMenu.cancelLeave}
            />
            <Button
              label="Quitter"
              color="destructive"
              className="w-auto flex-1"
              onPress={optionsMenu.confirmLeave}
            />
          </View>
        ) : (
          <View className="w-full gap-3">
            <Button
              size="medium"
              label="Reprendre"
              className="w-full"
              onPress={optionsMenu.resume}
            />
            <Button
              size="medium"
              label="Quitter"
              variant="outlined"
              color="destructive"
              className="w-full"
              onPress={optionsMenu.requestLeave}
            />
          </View>
        )}
      </Dialog>
    </>
  );
}
