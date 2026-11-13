import {
  createGameDisplay,
  type GameComponentProps,
  type GameDisplay,
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import {
  ActionPrompt,
  Button as DesignSystemButton,
  LoadingScreen,
  Screen,
} from '@cityborn/design-system';
import {
  useNavigation as useExpoNavigation,
  useFocusEffect,
} from 'expo-router';
import { useCallback } from 'react';
import { View } from 'tamagui';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { View as LegacyView } from '@/components/ui/native/NativeComponents';
import { GameOptions } from './GameOptions';
import Results from './Results';
import { Round } from './round/Round';

export const Game = ({
  localPlayerID,
  isHost,
  game,
  handleGuess,
  handleNextRound,
  handlePlayAgain,
  handleExitGame,
  handleLeaveGame,
}: GameComponentProps) => {
  const expoNavigation = useExpoNavigation();
  const gameDisplay: GameDisplay = createGameDisplay(game, localPlayerID);
  const optionsMenu: GameOptionsMenu = useGameOptionsMenu({
    leaveGame: handleLeaveGame,
  });

  useFocusEffect(
    useCallback(() => {
      expoNavigation.setOptions({ headerShown: false });

      return () => {
        expoNavigation.setOptions({ headerShown: true });
      };
    }, [expoNavigation.setOptions]),
  );

  if (gameDisplay.state === 'loading') return <LoadingScreen />;
  if (gameDisplay.state === 'unavailable') {
    return (
      <Screen bottomSafeArea>
        <ActionPrompt prompt="La partie est déjà en cours">
          <DesignSystemButton compact label="Menu" onPress={handleExitGame} />
        </ActionPrompt>
      </Screen>
    );
  }
  const activePlayerID = gameDisplay.localPlayerID;

  return (
    <View flex={1}>
      <Round
        localPlayerID={activePlayerID}
        isHost={isHost}
        game={game}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
        onOpenOptions={gameDisplay.showOptions ? optionsMenu.open : undefined}
      />
      {gameDisplay.showOptions && <GameOptions optionsMenu={optionsMenu} />}

      {gameDisplay.showResults && (
        <LegacyView>
          <Dialog visible={true} className="absolute h-[80%] w-[90%] p-8">
            <LegacyView className="flex-1 w-full">
              <Results game={game} localPlayerID={activePlayerID} />
            </LegacyView>
            <LegacyView className="flex gap-4 items-center justify-center">
              <Button
                variant="filled"
                size="large"
                label="Rejouer"
                onPress={async () => {
                  await handlePlayAgain();
                }}
              />
              <Button
                variant="default"
                label="Menu"
                onPress={async () => {
                  await handleExitGame();
                }}
              />
            </LegacyView>
          </Dialog>
        </LegacyView>
      )}
    </View>
  );
};
