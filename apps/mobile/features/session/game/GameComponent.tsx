import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text } from '@/components/ui/native/NativeComponents';
import { Game, GameStatus, Guess, RoundStatus, Session } from '@cityborn/types';
import ResultsComponent from './ResultsComponent';
import GuessComponent from './GuessComponent';
import { StyleSheet, View } from 'react-native';

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
    <View style={StyleSheet.absoluteFillObject}>
      <GuessComponent
        localPlayerID={localPlayerID}
        session={session}
        game={game}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
      />

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
