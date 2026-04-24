import type { Game, PlayerResults } from '@cityborn/types';
import { calculateTotalPoints, getGameResult } from '@cityborn/utils';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';

const Results = ({
  game,
  localPlayerID,
  isHost,
  handleEndGame,
  handlePlayAgain,
  handleExitGame,
}: {
  game: Game;
  localPlayerID: string;
  isHost: boolean;
  handleEndGame: () => Promise<void>;
  handlePlayAgain: () => Promise<void>;
  handleExitGame: () => Promise<void>;
}) => {
  const playersResults = new Map<string, PlayerResults>(getGameResult(game));
  const [localPlayerResults, setLocalPlayerResults] = useState<PlayerResults>();

  useEffect(() => {
    const currentPlayerResults = playersResults.get(localPlayerID);
    if (!currentPlayerResults) return;

    setLocalPlayerResults(currentPlayerResults);
  }, []);

  function getGuessObjectName(id: string): string {
    const guessObject = game.state.guessObjects?.find((obj) => obj.id === id);
    return guessObject ? guessObject.name : id;
  }

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
      {/* Titre + messages */}
      <View className="p-4 w-full items-center">
        <Text className="text-2xl p-2 mb-2">
          <Text className="font-bold text-4xl">
            {calculateTotalPoints(localPlayerResults)}
          </Text>{' '}
          pts
        </Text>
      </View>
      {playersResults.size > 1 ? (
        <View className="flex flex-col p-4">
          {/* Classement */}
          <Text className="font-bold text-center text-lg">Classement</Text>
          <View className="flex-row border-b border-gray-400 py-2 w-full">
            <Text className="flex-1 text-left font-semibold">Nom</Text>
            <Text className="flex-1 text-right font-semibold">Score</Text>
          </View>
          {Array.from(playersResults.entries())
            .sort(
              ([, a], [, b]) =>
                calculateTotalPoints(b) - calculateTotalPoints(a),
            )
            .map(([username, playerResult]) => (
              <View
                key={username}
                className="flex-row border-b border-gray-300 py-2 w-full"
              >
                <Text className="flex-1 text-left text-sm">{username}</Text>
                <Text className="flex-1 text-right text-sm">
                  {calculateTotalPoints(playerResult)}
                </Text>
              </View>
            ))}
        </View>
      ) : (
        <View className="flex-1 pb-4">
          {/* Résultats */}
          <Text className="text-lg font-bold mb-2 text-center">Résultats</Text>

          <ScrollView
            className="flex-1 pointer-events-auto"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Entête */}
            <View className="flex-row border-b border-gray-400 py-2 w-full">
              <Text className="flex-1 text-left font-semibold">Nom</Text>
              <Text className="flex-1 text-center font-semibold">Distance</Text>
              <Text className="flex-1 text-right font-semibold">Points</Text>
            </View>

            {/* Lignes de données */}
            {localPlayerResults.results.map((res, index) => (
              <View
                key={index}
                className="flex-row border-b border-gray-300 py-2 w-full"
              >
                <Text className="flex-1 text-left text-sm">
                  {getGuessObjectName(res.guessObjectId)}
                </Text>
                <Text className="flex-1 text-center text-sm">
                  {res.distance !== -1
                    ? res.distance.toFixed(2)
                    : 'Pas de guess'}
                </Text>
                <Text className="flex-1 text-right text-sm">{res.points}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Results;
