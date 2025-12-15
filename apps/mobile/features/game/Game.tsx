import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text } from '@/components/ui/native/NativeComponents';
import {
  Game as GameType,
  GameStatus,
  Guess as GuessType,
} from '@cityborn/types';
import Results from './components/Results';
import Guess from './components/Guess';
import { StyleSheet, View } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';

export const Game = ({
  localPlayerID,
  isHost,
  game,
  handleGuess,
  handleNextRound,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
}: {
  localPlayerID: string | undefined;
  isHost: boolean;
  game: GameType;
  handleGuess: (guess: GuessType) => Promise<void>;
  handleNextRound: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
}) => {
  const navigation = useNavigation();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(game.status === GameStatus.IN_RESULTS);
  }, [game.status]);

  // Hide header
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });

      return () => {
        navigation.setOptions({ headerShown: true });
      };
    }, []),
  );

  // Game starting or round loading
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
  // Player not in game and game already started
  if (!localPlayerID) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>La partie est déjà en cours</Text>
        <Button size="large" label="Menu" />
      </View>
    );
  }

  // Game render
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Guess */}
      <View style={StyleSheet.absoluteFill}>
        <Guess
          localPlayerID={localPlayerID}
          game={game}
          isHost={isHost}
          handleGuess={handleGuess}
          handleNextRound={handleNextRound}
        />
      </View>

      {/* Results */}
      {game.status === GameStatus.IN_RESULTS && (
        <View>
          <Dialog
            visible={showResults}
            className="absolute h-[80%] w-[90%] p-8"
          >
            <View className="flex-1 w-full">
              <Results
                game={game}
                localPlayerID={localPlayerID}
                isHost={isHost}
                handleEndGame={handleEndGame}
                handlePlayAgain={handlePlayAgain}
                handleExitGame={handleExitGame}
              />
            </View>
            <View className="flex gap-4 items-center justify-center">
              <Button
                variant="filled"
                size="large"
                label="Rejouer"
                onPress={async () => {
                  setShowResults(false);
                  await handleEndGame();
                }}
              />
              <Button
                variant="default"
                label="Menu"
                onPress={async () => {
                  setShowResults(false);
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
