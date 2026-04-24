import {
  type Game,
  type Guess,
  type GuessObject,
  type Round,
  RoundStatus,
} from '@cityborn/types';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Text, View } from '@/components/ui/native/NativeComponents';
import GuessObjectCard from './GuessObjectCard';
import Timer from './Timer';

function GuessResult({
  currentRound,
  guessObject,
  localPlayerID,
}: {
  currentRound: Round;
  guessObject: GuessObject;
  localPlayerID: string;
}) {
  if (
    !currentRound.playersGuesses ||
    currentRound.status !== RoundStatus.SHOWING_RESULTS
  ) {
    return null;
  }

  const playerGuess = currentRound.playersGuesses[localPlayerID];

  return (
    <View className="flex flex-col gap-2 items-center justify-center w-full">
      <Card size="medium" className="bg-primary">
        <View className="flex flex-col">
          <Text className="text-foreground-on-primary text-xl md:text-xl lg:text-2xl font-bold text-center">
            {playerGuess.points} pts
          </Text>

          {Object.keys(currentRound.playersGuesses).length > 1 && (
            <View>
              <View className="my-1 w-[70%] self-center border-b border-foreground-on-primary" />

              <View className="flex flex-row flex-wrap justify-center items-center mt-2 gap-1 w-full">
                {Object.entries(currentRound.playersGuesses).map(
                  ([playerID, guess]) => {
                    if (playerID === localPlayerID) return null;

                    return (
                      <View key={playerID} className="px-1">
                        <Text className="text-foreground-on-primary text-base font-semibold text-center">
                          {playerID}: {guess.points}
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>
            </View>
          )}
        </View>
      </Card>

      {/* Guess Info */}
      <Card size="small" className="bg-background w-[80%]">
        <View>
          <Text className="text-xl font-bold text-center">
            {guessObject.world_location?.name}
          </Text>

          {playerGuess.distance !== -1 ? (
            playerGuess.distance === 0 ? (
              <Text className=" text-sm md:text-base font-bold mt-1 text-center">
                Bien joué ! Tu as deviné !
              </Text>
            ) : (
              <Text className="0 text-sm md:text-base mt-1 text-center">
                Tu es à{' '}
                <Text className="font-bold text-center">
                  {playerGuess.distance.toFixed(0)}
                </Text>{' '}
                km
              </Text>
            )
          ) : (
            <Text className=" font-bold text-sm md:text-base mt-1 text-center">
              Tu n'as pas deviné à temps !
            </Text>
          )}
        </View>
      </Card>
    </View>
  );
}

interface OverlayProps {
  localPlayerID: string;
  preGuess: Guess | undefined;
  game: Game;
  isHost: boolean;
  handleGuess: (value: Guess) => void | Promise<void>;
  handleIsTimeUp: () => void;
  handleNextRound: () => void | Promise<void>;
}

const Overlay = ({
  localPlayerID,
  preGuess,
  game,
  isHost,
  handleGuess,
  handleIsTimeUp,
  handleNextRound,
}: OverlayProps) => {
  const [timerEnded, setTimerEnded] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTimerEnded(false);
    setHasGuessed(false);
  }, [game.state.currentRound?.guessObjectId]);

  useEffect(() => {
    if (timerEnded) {
      handleIsTimeUp();
    }
  }, [timerEnded]);

  const currentGuessObject = game.state.guessObjects!.find(
    (obj) => obj.id === game.state.currentRound!.guessObjectId,
  )!;

  return (
    <View
      className="h-full w-full"
      style={{
        position: 'absolute',
        top: insets.top,
        bottom: insets.bottom + 16,
        right: 16,
        left: 16,
      }}
    >
      <View className="absolute top-5 w-full">
        {/* Timer */}
        <View className="absolute left-0 w-40">
          {game.state.currentRound!.status === RoundStatus.GUESSING && (
            <Timer
              totalTime={game.config.timer}
              endMessage="Terminé !"
              setTimerEnded={setTimerEnded}
            />
          )}
        </View>

        {/* GuessObject card */}
        <View className="absolute right-0">
          <GuessObjectCard guessObject={currentGuessObject} />
        </View>
      </View>

      {/* Round results */}
      <View className="absolute bottom-0 w-full z-10">
        {game.state.currentRound!.status === RoundStatus.GUESSING && (
          <View className="relative w-full flex justify-center items-center bg-transparent">
            <Button
              size="large"
              label={
                hasGuessed
                  ? `${Object.keys(game.state.currentRound?.playersGuesses!).length}/${Object.keys(game.state.results).length}...`
                  : 'GUESS'
              }
              disabled={
                !preGuess ||
                game.state.currentRound?.playersGuesses?.[localPlayerID] !==
                  undefined
              }
              onPress={async () => {
                await handleGuess(preGuess!);
                setHasGuessed(true);
              }}
            />
          </View>
        )}

        {game.state.currentRound!.status === RoundStatus.SHOWING_RESULTS && (
          <GuessResult
            currentRound={game.state.currentRound!}
            guessObject={currentGuessObject}
            localPlayerID={localPlayerID}
          />
        )}
      </View>

      {/* Next button / counter */}
      {game.state.currentRound && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: '55%',
            transform: [{ translateY: -50 }],
            zIndex: 50,
            backgroundColor: 'transparent',
          }}
        >
          <View
            className="flex flex-col gap-2 bg-transparent"
            pointerEvents="auto"
          >
            {game.state.currentRound.status === RoundStatus.SHOWING_RESULTS && (
              <Button
                size="small"
                label="->"
                className="w-auto text-center"
                disabled={!isHost}
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
    </View>
  );
};

export default Overlay;
