import {
  type FullGuessObject,
  type Game,
  type Guess,
  type PlayerId,
  RoundStatus,
} from '@cityborn/api';
import {
  canSubmitGuess,
  createGameDisplay,
  createRoundResult,
  currentGuessObject,
  formatDistanceInKm,
  type GameDisplay,
  type RoundGuessOutcome,
  type RoundResult,
} from '@cityborn/client/game';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Text, View } from '@/components/ui/native/NativeComponents';
import GuessObjectCard from './GuessObjectCard';
import Timer from './Timer';

type OverlayProps = {
  localPlayerID: PlayerId;
  preGuess: Guess | undefined;
  game: Game;
  isHost: boolean;
  handleGuess: (value: Guess) => Promise<void>;
  handleIsTimeUp: () => void;
  handleNextRound: () => Promise<void>;
};

function LocalGuessOutcome({ outcome }: { outcome: RoundGuessOutcome }) {
  if (outcome.kind === 'timedOut') {
    return (
      <Text className=" font-bold text-sm md:text-base mt-1 text-center">
        Tu n'as pas deviné à temps !
      </Text>
    );
  }
  if (outcome.kind === 'found') {
    return (
      <Text className=" text-sm md:text-base font-bold mt-1 text-center">
        Bien joué ! Tu as deviné !
      </Text>
    );
  }
  return (
    <Text className="text-sm md:text-base mt-1 text-center">
      Tu es à{' '}
      <Text className="font-bold text-center">
        {formatDistanceInKm(outcome.distanceInKm)}
      </Text>{' '}
      km
    </Text>
  );
}

function GuessResult({ roundResult }: { roundResult: RoundResult }) {
  return (
    <View className="flex flex-col gap-2 items-center justify-center w-full">
      <Card size="medium" className="bg-primary">
        <View className="flex flex-col">
          <Text className="text-foreground-on-primary text-xl md:text-xl lg:text-2xl font-bold text-center">
            {roundResult.localPoints} pts
          </Text>

          {roundResult.otherPlayersPoints.length > 0 && (
            <View>
              <View className="my-1 w-[70%] self-center border-b border-foreground-on-primary" />

              <View className="flex flex-row flex-wrap justify-center items-center mt-2 gap-1 w-full">
                {roundResult.otherPlayersPoints.map(({ playerID, points }) => (
                  <View key={playerID} className="px-1">
                    <Text className="text-foreground-on-primary text-base font-semibold text-center">
                      {playerID}: {points}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Card>

      <Card size="small" className="bg-background w-[80%]">
        <View>
          <Text className="text-xl font-bold text-center">
            {roundResult.guessObject.world_location.name}
          </Text>
          <LocalGuessOutcome outcome={roundResult.localOutcome} />
        </View>
      </Card>
    </View>
  );
}

export default function Overlay({
  localPlayerID,
  preGuess,
  game,
  isHost,
  handleGuess,
  handleIsTimeUp,
  handleNextRound,
}: OverlayProps) {
  const [hasGuessed, setHasGuessed] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const guessObject: FullGuessObject | undefined = currentGuessObject(game);
  const roundResult: RoundResult | undefined = createRoundResult(
    game,
    localPlayerID,
  );
  const gameDisplay: GameDisplay = createGameDisplay(game, localPlayerID);
  const currentRound = game.state.currentRound;
  const isGuessing: boolean = currentRound?.status === RoundStatus.GUESSING;
  const guessedPlayerCount: number = Object.keys(
    currentRound?.playersGuesses ?? {},
  ).length;
  const playerCount: number = Object.keys(game.state.results).length;

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
      <View className="absolute top-5 w-full">
        <View className="absolute left-0 w-40">
          {isGuessing && (
            <Timer
              totalTimeInSeconds={game.config.timer}
              endMessage="Terminé !"
              onTimeUp={handleIsTimeUp}
            />
          )}
        </View>

        {guessObject && (
          <View className="absolute right-0">
            <GuessObjectCard guessObject={guessObject} />
          </View>
        )}
      </View>

      <View className="absolute bottom-0 w-full z-10">
        {isGuessing && (
          <View className="relative w-full flex justify-center items-center bg-transparent">
            <Button
              size="large"
              label={
                hasGuessed ? `${guessedPlayerCount}/${playerCount}...` : 'GUESS'
              }
              disabled={!canSubmitGuess(game, localPlayerID, preGuess)}
              onPress={async () => {
                if (!preGuess) return;
                await handleGuess(preGuess);
                setHasGuessed(true);
              }}
            />
          </View>
        )}

        {roundResult && <GuessResult roundResult={roundResult} />}
      </View>

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
          {gameDisplay.showNextRound && (
            <Button
              size="small"
              label="->"
              className="w-auto text-center"
              disabled={!isHost}
              onPress={handleNextRound}
            />
          )}
          {gameDisplay.roundNumber !== undefined && (
            <View className="bg-gray-200 text-black text-center px-3 py-1 rounded-full shadow text-sm font-semibold">
              <Text>
                {gameDisplay.roundNumber}/{gameDisplay.roundCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
