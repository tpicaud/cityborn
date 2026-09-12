import { GameStatus, type Game as GameType } from '@cityborn/api';
import type { SessionController } from '@cityborn/client/session';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text } from '@/components/ui/native/NativeComponents';
import Guess from './components/Guess';
import Results from './components/Results';

export const Game = ({
  localPlayerID,
  game,
  sessionController,
}: {
  localPlayerID: string | undefined;
  game: GameType;
  sessionController: SessionController;
}) => {
  const navigation = useNavigation();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(game.status === GameStatus.IN_RESULTS);
  }, [game.status]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });

      return () => {
        navigation.setOptions({ headerShown: true });
      };
    }, [navigation.setOptions]),
  );

  if (
    (!game.state.currentRound && game.status === GameStatus.IN_GAME) ||
    game.status === GameStatus.STARTING
  ) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );
  }
  if (!localPlayerID) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>La partie est déjà en cours</Text>
        <Button size="large" label="Menu" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        <Guess
          localPlayerID={localPlayerID}
          game={game}
          isHost={sessionController.isHost}
          handleGuess={sessionController.guess}
          handleNextRound={sessionController.nextRound}
        />
      </View>

      {game.status === GameStatus.IN_RESULTS && (
        <View>
          <Dialog
            visible={showResults}
            className="absolute h-[80%] w-[90%] p-8"
          >
            <View className="flex-1 w-full">
              <Results game={game} localPlayerID={localPlayerID} />
            </View>
            <View className="flex gap-4 items-center justify-center">
              <Button
                variant="filled"
                size="large"
                label="Rejouer"
                onPress={async () => {
                  setShowResults(false);
                  await sessionController.endGame();
                }}
              />
              <Button
                variant="default"
                label="Menu"
                onPress={async () => {
                  setShowResults(false);
                  await sessionController.exitGame();
                }}
              />
            </View>
          </Dialog>
        </View>
      )}
    </View>
  );
};
