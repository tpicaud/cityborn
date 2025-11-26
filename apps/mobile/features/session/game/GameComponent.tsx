import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text } from '@/components/ui/native/NativeComponents';
import { Game, GameStatus, Guess, RoundStatus, Session } from '@cityborn/types';
import ResultsComponent from './ResultsComponent';
import GuessComponent from './GuessComponent';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { View } from 'react-native';

export const GameComponent = ({
  localPlayerID,
  isHost,
  session,
  game,
  handleGuess,
  handleNextRound,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
}: {
  localPlayerID: string | undefined;
  isHost: boolean;
  session: Session;
  game: Game;
  handleGuess: (guess: Guess) => Promise<void>;
  handleNextRound: () => Promise<void>;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
}) => {
  const insets = useSafeAreaInsets();

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
    <View
      style={{
        position: 'absolute',
        top: insets.top,
        bottom: insets.bottom + 16,
        right: 16,
        left: 16,
      }}
    >
      <GuessComponent
        localPlayerID={localPlayerID}
        session={session}
        game={game}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
      />

      {/* Bouton / compteur à droite */}
      {game.state.currentRound && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: '55%',
            transform: [{ translateY: -50 }],
            zIndex: 50,
          }}
        >
          <View className="flex flex-col gap-2">
            {game.state.currentRound.status === RoundStatus.SHOWING_RESULTS && (
              <Button
                size="small"
                label="->"
                className="w-auto text-center"
                onPress={async () => await handleNextRound()}
              />
            )}
            <View className="bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold">
              <Text>
                {game.state.guessObjectsIds.findIndex(
                  (id) => game.state.currentRound!.guessObjectId === id,
                ) + 1}
                /{game.state.guessObjectsIds!.length}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Dialog results */}
      {game.status === GameStatus.IN_RESULTS && (
        <Dialog visible={true} className="h-[80%] w-[90%] p-8">
          <View className="flex-1 w-full">
            <ResultsComponent
              game={game}
              localPlayerID={localPlayerID}
              isHost={isHost}
              mode={session.mode}
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
              onPress={handleEndGame}
            />
            <Button variant="default" label="Menu" onPress={handleExitGame} />
          </View>
        </Dialog>
      )}
    </View>
  );
};
