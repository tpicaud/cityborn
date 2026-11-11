'use client';

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
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
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

  if (!sessionController.session)
    return <LoadingDialog message="Chargement de la session" />;

  return (
    <>
      {sessionController.session.status === SessionStatus.IN_GAME &&
      sessionController.session.currentGame ? (
        <Game
          localPlayerID={sessionController.localPlayerID}
          isHost={sessionController.isHost}
          session={sessionController.session}
          game={sessionController.session.currentGame}
          handleGuess={sessionController.guess}
          handleNextRound={sessionController.nextRound}
          handleEndGame={sessionController.endGame}
          handlePlayAgain={sessionController.playAgain}
          handleExitGame={sessionController.exitGame}
          handleLeaveGame={sessionController.leaveGame}
        />
      ) : sessionController.isLaunchingGame ? (
        <LoadingDialog message="Lancement de la partie" />
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
        <LoadingDialog message="Reconnexion..." />
      )}

      {sessionController.connectionStatus === 'closed' && (
        <ConnectionLostDialog
          onRetry={sessionController.retryConnection}
          onExit={sessionController.exitGame}
        />
      )}
    </>
  );
}
