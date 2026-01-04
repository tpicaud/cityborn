import { SessionMode, PlayerResults, ScoreType } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { Game } from '@cityborn/types';
import { getGameResult, calculateTotalPoints } from '@cityborn/utils';
import { apiClient } from '@/lib/apiClient';
import { Text, View } from '@/components/ui/native/NativeComponents';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { ScrollView } from 'react-native';

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
  const [sentence, setSentence] = useState<{
    message: string;
    sub_message_1: string;
    sub_message_2: string;
  }>();
  const [localPlayerResults, setLocalPlayerResults] = useState<PlayerResults>();

  useEffect(() => {
    const currentPlayerResults = playersResults.get(localPlayerID);
    if (!currentPlayerResults) return;

    setLocalPlayerResults(currentPlayerResults);

    let isMounted = true;
    generateEndSentence(currentPlayerResults).then((sentence) => {
      if (isMounted) {
        setSentence(sentence);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function getGuessObjectName(id: string): string {
    const guessObject = game.state.guessObjects?.find((obj) => obj.id === id);
    return guessObject ? guessObject.name : id;
  }

  async function generateEndSentence(playerResults: PlayerResults): Promise<{
    message: string;
    sub_message_1: string;
    sub_message_2: string;
  }> {
    const totalPoints = calculateTotalPoints(playerResults);
    const getScoreType = (points: number): ScoreType => {
      const avg_score = points / game.state.guessObjectsIds.length;
      if (avg_score < 500) return ScoreType.BAD;
      if (avg_score < 833) return ScoreType.AVERAGE;
      return ScoreType.GOOD;
    };

    const scoreType = getScoreType(totalPoints);
    let message = '';
    try {
      message = (await apiClient.getEndSentence(scoreType)).message ?? '';
    } catch (error) {
      switch (scoreType) {
        case ScoreType.GOOD:
          message = 'Tu es le croissant le plus doré de la boulangerie !';
        case ScoreType.AVERAGE:
          message =
            'Ce n’est pas la tarte aux fraises de grand-mère, mais ça se mange.';
        case ScoreType.BAD:
          message = "Tu n'es pas la tortue la plus ninja des égouts.";
      }
      console.error(error);
    }

    let sub_message_1 = '';
    let sub_message_2 = '';

    if (scoreType === ScoreType.BAD) {
      sub_message_1 = 'Bon... ';
      sub_message_2 = 'Essaie encore !';
    } else if (scoreType === ScoreType.GOOD) {
      sub_message_1 = 'Félicitation ! ';
    } else if (scoreType === ScoreType.AVERAGE) {
      sub_message_2 = 'Essaie encore !';
    }

    return { message, sub_message_1, sub_message_2 };
  }

  if (!sentence || !localPlayerResults) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargements des résultats</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full">
      {/* Titre + messages */}
      <View className="p-4 w-full items-center">
        <Text className="text-2xl p-2">
          <Text className="font-bold text-4xl">
            {calculateTotalPoints(localPlayerResults)}
          </Text>{' '}
          pts
        </Text>
        <Text>{sentence.sub_message_1}</Text>
        <Text>{sentence.message}</Text>
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
