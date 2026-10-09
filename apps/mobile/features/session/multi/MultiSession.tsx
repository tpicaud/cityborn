import { type SessionId, SessionStatus } from '@cityborn/api';
import {
  type MultiSessionController,
  useMultiSession,
} from '@cityborn/client/session';
import Button from '@/components/ui/Button';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { useNavigation } from '@/lib/navigation';
import { createSocketConnection } from '@/lib/socket';
import { MultiLobby } from './MultiLobby';

type MultiSessionProps = {
  sessionID: SessionId;
};

export default function MultiSession({ sessionID }: MultiSessionProps) {
  const navigation = useNavigation();
  const multiSession: MultiSessionController = useMultiSession({
    sessionID,
    navigation,
    createSocket: createSocketConnection,
  });

  if (!multiSession.session) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargement de la session</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
        <Game
          localPlayerID={multiSession.localPlayerID}
          isHost={multiSession.isHost}
          game={multiSession.session.currentGame}
          handleGuess={multiSession.guess}
          handleNextRound={multiSession.nextRound}
          handleEndGame={multiSession.endGame}
          handlePlayAgain={multiSession.playAgain}
          handleExitGame={multiSession.exitGame}
        />
      ) : (
        <MultiLobby
          localPlayerID={multiSession.localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          handleUpdateGameConfig={multiSession.updateGameConfig}
          handleStartGame={multiSession.startGame}
          handleJoinSession={multiSession.join}
        />
      )}

      {multiSession.connectionStatus === 'reconnecting' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
            <LoaderIcon />
            <Text className="text-center">Reconnexion...</Text>
          </View>
        </View>
      )}

      {multiSession.connectionStatus === 'closed' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
            <Text className="text-center">Connexion à la session perdue</Text>
            <View className="flex-row gap-3">
              <Button
                label="Quitter"
                variant="outlined"
                onPress={multiSession.exitGame}
              />
              <Button
                label="Réessayer"
                onPress={multiSession.retryConnection}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
