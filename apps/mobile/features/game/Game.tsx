import {
  createGameDisplay,
  type GameComponentProps,
  type GameDisplay,
  type GameOptionsMenu,
  useGameOptionsMenu,
} from '@cityborn/client/game';
import {
  ActionPrompt,
  Button,
  LoadingScreen,
  Screen,
} from '@cityborn/design-system';
import {
  useNavigation as useExpoNavigation,
  useFocusEffect,
} from 'expo-router';
import { useCallback } from 'react';
import { View } from 'tamagui';
import { GameOptions } from './GameOptions';
import { Results } from './Results';
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
          <Button compact label="Menu" onPress={handleExitGame} />
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
        finalResults={
          gameDisplay.showResults ? (
            <Results
              game={game}
              localPlayerID={activePlayerID}
              isHost={isHost}
              handlePlayAgain={handlePlayAgain}
              handleExitGame={handleExitGame}
            />
          ) : undefined
        }
      />
      {gameDisplay.showOptions && <GameOptions optionsMenu={optionsMenu} />}
    </View>
  );
};
