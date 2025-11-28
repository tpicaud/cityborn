import { GameConfig, Guess, GuessObject, Round } from '@cityborn/types';
import GuessObjectCard from './GuessObjectCard';
import Timer from './Timer';
import { RoundStatus } from '@cityborn/types';
import { Game } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { Text } from '@/components/ui/native/NativeComponents';
import Button from '@/components/ui/Button';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      {/* Points Box */}
      <View className="flex flex-col py-2 px-4 text-xl bg-green-200 rounded shadow">
        <Text className="text-green-600 text-xl md:text-xl lg:text-2xl font-bold text-center">
          {playerGuess.points} pts
        </Text>

        {Object.keys(currentRound.playersGuesses).length > 1 && (
          <>
            {/* Simili <hr> */}
            <View className="my-1 w-[70%] self-center border-b border-green-600" />

            <View className="flex flex-row flex-wrap justify-center mt-2 gap-1 w-full">
              {Object.entries(currentRound.playersGuesses).map(
                ([playerID, guess]) => {
                  if (playerID === localPlayerID) return null;

                  return (
                    <View key={playerID} className="px-1">
                      <Text className="text-green-700 text-xs md:text-base font-semibold">
                        {playerID}: {guess.points}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>
          </>
        )}
      </View>

      {/* Guess Info */}
      <View className="p-2 text-center bg-blue-200 rounded shadow w-full">
        <Text className="text-blue-600 text-xs md:text-base lg:text-xl">
          <Text className="font-bold text-center">{guessObject.name}</Text> est
          né à{' '}
          <Text className="font-bold text-center">
            {guessObject.world_location?.name}
          </Text>
        </Text>

        {playerGuess.distance !== -1 ? (
          playerGuess.distance === 0 ? (
            <Text className="text-blue-600 text-sm md:text-base font-bold mt-1 text-center">
              Bien joué ! Tu as deviné !
            </Text>
          ) : (
            <Text className="text-blue-600 text-sm md:text-base mt-1 text-center">
              Tu es à{' '}
              <Text className="font-bold text-center">
                {playerGuess.distance.toFixed(2)}
              </Text>{' '}
              km
            </Text>
          )
        ) : (
          <Text className="text-blue-600 font-bold text-sm md:text-base mt-1 text-center">
            Tu n'as pas deviné à temps !
          </Text>
        )}
      </View>
    </View>
  );
}

interface OverlayProps {
  localPlayerID: string;
  preGuess: Guess | undefined;
  game: Game;
  handleGuess: (value: Guess) => void | Promise<void>;
  handleIsTimeUp: () => void;
  handleNextRound: () => void | Promise<void>;
}

const Overlay = ({
  localPlayerID,
  preGuess,
  game,
  handleGuess,
  handleIsTimeUp,
  handleNextRound,
}: OverlayProps) => {
  const [timerEnded, setTimerEnded] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTimerEnded(false);
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
        {/* Timer positionné en overlay */}
        <View className="absolute left-0 w-40">
          {game.state.currentRound!.status === RoundStatus.GUESSING && (
            <Timer
              totalTime={game.config.timer}
              endMessage="Terminé !"
              setTimerEnded={setTimerEnded}
            />
          )}
        </View>
        {/* Carte de la personne à deviner */}

        <View className="absolute right-0">
          <GuessObjectCard guessObject={currentGuessObject} />
        </View>
      </View>

      {/* Zone boutons / résultats */}
      <View className="absolute bottom-0 bg-transparent w-full z-10">
        {game.state.currentRound!.status === RoundStatus.GUESSING && (
          <View className="relative w-full flex justify-center items-center bg-transparent">
            <Button
              size="large"
              label="GUESS"
              disabled={
                !preGuess ||
                game.state.currentRound?.playersGuesses?.[localPlayerID] !==
                  undefined
              }
              onPress={async () => await handleGuess(preGuess!)}
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
          <View className="flex flex-col gap-2" pointerEvents="auto">
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
    </View>
  );
};

export default Overlay;
