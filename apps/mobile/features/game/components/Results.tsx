import type { Game, PlayerId } from '@cityborn/api';
import { createGameResults } from '@cityborn/client/game';
import { ScrollView } from 'react-native';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';

const Results = ({
  game,
  localPlayerID,
}: {
  game: Game;
  localPlayerID: PlayerId;
}) => {
  const gameResults = createGameResults(game, localPlayerID);
  const { localPlayerResults } = gameResults;

  if (!localPlayerResults) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargements des résultats</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full gap-4">
      <View className="p-4 w-full items-center">
        <Text className="text-2xl p-2 mb-2">
          <Text className="font-bold text-4xl">
            {localPlayerResults.totalPoints}
          </Text>{' '}
          pts
        </Text>
      </View>
      {gameResults.isMultiplayer ? (
        <View className="flex flex-col p-4">
          <Text className="font-bold text-center text-lg">Classement</Text>
          <View className="flex-row border-b border-gray-400 py-2 w-full">
            <Text className="flex-1 text-left font-semibold">Nom</Text>
            <Text className="flex-1 text-right font-semibold">Score</Text>
          </View>
          {gameResults.playersResults.map(({ playerID, totalPoints }) => (
            <View
              key={playerID}
              className="flex-row border-b border-gray-300 py-2 w-full"
            >
              <Text className="flex-1 text-left text-sm">{playerID}</Text>
              <Text className="flex-1 text-right text-sm">{totalPoints}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-1 pb-4">
          <Text className="text-lg font-bold mb-2 text-center">Résultats</Text>

          <ScrollView
            className="flex-1 pointer-events-auto"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View className="flex-row border-b border-gray-400 py-2 w-full">
              <Text className="flex-1 text-left font-semibold">Nom</Text>
              <Text className="flex-1 text-center font-semibold">Distance</Text>
              <Text className="flex-1 text-right font-semibold">Points</Text>
            </View>

            {localPlayerResults.roundResults.map((roundResult) => (
              <View
                key={roundResult.guessObjectID}
                className="flex-row border-b border-gray-300 py-2 w-full"
              >
                <Text className="flex-1 text-left text-sm">
                  {roundResult.guessObjectName}
                </Text>
                <Text className="flex-1 text-center text-sm">
                  {roundResult.distanceInKm !== undefined
                    ? roundResult.distanceInKm.toFixed(2)
                    : 'Pas de guess'}
                </Text>
                <Text className="flex-1 text-right text-sm">
                  {roundResult.points}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Results;
