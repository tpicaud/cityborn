import { type SessionId, SessionMode, SessionStatus } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionController,
  useSessionController,
} from '@cityborn/client/session';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { useNavigation } from '@/lib/navigation';
import { ConnectionLostDialog } from './ConnectionLostDialog';
import { MultiLobby } from './lobby/MultiLobby';
import { SoloLobby } from './lobby/SoloLobby';

type SessionProps = {
  sessionID: SessionId;
};

export default function Session({ sessionID }: SessionProps) {
  const navigation: Navigation = useNavigation();
  const sessionController: SessionController = useSessionController({
    sessionID,
    navigation,
  });

  if (!sessionController.session) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargement de la session</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {sessionController.isAdmitting ? (
        <View className="flex-1 items-center justify-center">
          <LoaderIcon />
          <Text>Connexion à la partie</Text>
        </View>
      ) : sessionController.localPlayerID &&
        sessionController.session.status === SessionStatus.IN_GAME &&
        sessionController.session.currentGame ? (
        <Game
          localPlayerID={sessionController.localPlayerID}
          isHost={sessionController.isHost}
          game={sessionController.session.currentGame}
          handleGuess={sessionController.guess}
          handleNextRound={sessionController.nextRound}
          handleEndGame={sessionController.endGame}
          handlePlayAgain={sessionController.playAgain}
          handleExitGame={sessionController.exitGame}
        />
      ) : sessionController.session.mode === SessionMode.SOLO ? (
        <SoloLobby
          isHost={sessionController.isHost}
          session={sessionController.session}
          handleUpdateGameConfig={sessionController.updateGameConfig}
          handleStartGame={sessionController.startGame}
        />
      ) : (
        <MultiLobby
          localPlayerID={sessionController.localPlayerID}
          isHost={sessionController.isHost}
          session={sessionController.session}
          handleUpdateGameConfig={sessionController.updateGameConfig}
          handleStartGame={sessionController.startGame}
          handleJoinSession={sessionController.join}
        />
      )}

      {sessionController.connectionStatus === 'reconnecting' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
            <LoaderIcon />
            <Text className="text-center">Reconnexion...</Text>
          </View>
        </View>
      )}

      {sessionController.connectionStatus === 'closed' && (
        <ConnectionLostDialog
          onRetry={sessionController.retryConnection}
          onExit={sessionController.exitGame}
        />
      )}
    </View>
  );
}
