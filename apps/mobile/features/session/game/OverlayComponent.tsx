import { Guess, GuessObject, Round, Session } from '@cityborn/types';
import GuessObjectCard from './GuessObjectCard';
import TimerComponent from './TimerComponent';
import { RoundStatus } from '@cityborn/types';
import { Game } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { View, Text } from '@/components/ui/native/NativeComponents';
import Button from '@/components/ui/Button';

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
    <View className="flex flex-col m-2 gap-2 items-center justify-center w-full">
      {/* Points Box */}
      <View className="flex flex-col py-2 px-4 text-xl text-center bg-green-200 rounded shadow">
        <Text className="text-green-600 text-xl md:text-xl lg:text-2xl font-bold">
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
          <Text className="font-bold">{guessObject.name}</Text> est né à{' '}
          <Text className="font-bold">{guessObject.world_location?.name}</Text>
        </Text>

        {playerGuess.distance !== -1 ? (
          playerGuess.distance === 0 ? (
            <Text className="text-blue-600 text-sm md:text-base font-bold mt-1">
              Bien joué ! Tu as deviné !
            </Text>
          ) : (
            <Text className="text-blue-600 text-sm md:text-base mt-1">
              Tu es à{' '}
              <Text className="font-bold">
                {playerGuess.distance.toFixed(2)}
              </Text>{' '}
              km
            </Text>
          )
        ) : (
          <Text className="text-blue-600 font-bold text-sm md:text-base mt-1">
            Tu n'as pas deviné à temps !
          </Text>
        )}
      </View>
    </View>
  );
}

interface OverlayComponentProps {
  localPlayerID: string;
  preGuess: Guess | undefined;
  session: Session;
  game: Game;
  handleGuess: (value: Guess) => void | Promise<void>;
  handleIsTimeUp: () => void;
  handleNextRound: () => void;
}

const OverlayComponent = ({
  localPlayerID,
  preGuess,
  session,
  game,
  handleGuess,
  handleIsTimeUp,
}: OverlayComponentProps) => {
  const [timerEnded, setTimerEnded] = useState(false);

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
    <View>
      {/* Carte de la personne à deviner */}
      <GuessObjectCard guessObject={currentGuessObject} />

      {/* Timer positionné en overlay */}
      <View className="absolute w-[27%] mx-6 my-14">
        {game.state.currentRound!.status === RoundStatus.GUESSING && (
          <TimerComponent
            totalTime={session.gameConfig.timer}
            endMessage="Terminé !"
            setTimerEnded={setTimerEnded}
          />
        )}
      </View>

      {/* Zone boutons / résultats */}
      <View className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[80%] min-w-20">
        {game.state.currentRound!.status === RoundStatus.GUESSING && (
          <View className="relative w-full flex justify-center items-center">
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
    </View>
  );
};

export default OverlayComponent;
