import {
  createGameViewModel,
  type GameComponentProps,
} from '@cityborn/client/game';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text } from '@/components/ui/native/NativeComponents';
import Guess from './components/Guess';
import Results from './components/Results';

export const Game = ({
  localPlayerID,
  isHost,
  game,
  handleGuess,
  handleNextRound,
  handlePlayAgain,
  handleExitGame,
}: GameComponentProps) => {
  const navigation = useNavigation();
  const gameViewModel = createGameViewModel(game, localPlayerID);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });

      return () => {
        navigation.setOptions({ headerShown: true });
      };
    }, [navigation.setOptions]),
  );

  if (gameViewModel.displayState === 'loading') {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );
  }
  if (gameViewModel.displayState === 'unavailable') {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>La partie est déjà en cours</Text>
        <Button size="large" label="Menu" />
      </View>
    );
  }
  const activePlayerID = gameViewModel.localPlayerID;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        <Guess
          localPlayerID={activePlayerID}
          game={game}
          isHost={isHost}
          handleGuess={handleGuess}
          handleNextRound={handleNextRound}
        />
      </View>

      {gameViewModel.showResults && (
        <View>
          <Dialog visible={true} className="absolute h-[80%] w-[90%] p-8">
            <View className="flex-1 w-full">
              <Results game={game} localPlayerID={activePlayerID} />
            </View>
            <View className="flex gap-4 items-center justify-center">
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
            </View>
          </Dialog>
        </View>
      )}
    </View>
  );
};
