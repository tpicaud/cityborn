import {
  type PackId,
  type SessionId,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
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
import { PlayerDepartureNotice } from './PlayerDepartureNotice';

type SessionProps = {
  sessionID: SessionId;
  launchedPackId: PackId | undefined;
};

export default function Session({ sessionID, launchedPackId }: SessionProps) {
  const navigation: Navigation = useNavigation();
  const sessionController: SessionController = useSessionController({
    sessionID,
    navigation,
    launchedPackId,
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
      {sessionController.session.status === SessionStatus.IN_GAME &&
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
          handleLeaveGame={sessionController.leaveGame}
        />
      ) : sessionController.isLaunchingGame ? (
        <View className="flex-1 items-center justify-center">
          <LoaderIcon />
          <Text className="text-center">Lancement de la partie</Text>
        </View>
      ) : sessionController.session.mode === SessionMode.SOLO ? (
        <SoloLobby handlePlayPack={sessionController.playPack} />
      ) : (
        <MultiLobby
          localPlayerID={sessionController.localPlayerID}
          isHost={sessionController.isHost}
          session={sessionController.session}
          handlePlayPack={sessionController.playPack}
          handleJoinSession={sessionController.join}
        />
      )}

      <PlayerDepartureNotice
        departedPlayerIDs={sessionController.departedPlayerIDs}
      />

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
