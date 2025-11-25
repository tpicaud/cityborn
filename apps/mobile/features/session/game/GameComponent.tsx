import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { Game, GameStatus, Guess, RoundStatus, Session } from '@cityborn/types';
import ResultsComponent from './ResultsComponent';
import GuessComponent from './GuessComponent';

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
    <View>
      <GuessComponent
        localPlayerID={localPlayerID}
        session={session}
        game={game}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
      />
      {game.state.currentRound && (
        <View className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <View className="flex flex-col gap-2">
            {game.state.currentRound.status === RoundStatus.SHOWING_RESULTS && (
              <Button size="small" label="→" />
            )}
            <View className="bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold">
              {game.state.guessObjectsIds.findIndex(
                (id) => game.state.currentRound!.guessObjectId === id,
              ) + 1}
              /{game.state.guessObjectsIds!.length}
            </View>
          </View>
        </View>
      )}

      {game.status === GameStatus.IN_RESULTS && (
        <View className="absolute h-full w-full">
          <View className="flex flex-row w-full h-full items-center justify-center">
            <Dialog visible={true}>
              <View className="w-[80%]">
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
            </Dialog>
          </View>
        </View>
      )}
    </View>
  );
};
