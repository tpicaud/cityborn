'use client';

import { type SessionId, SessionStatus } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import {
  type SessionController,
  useSessionController,
} from '@cityborn/client/session';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import { Game } from '@/features/game/Game';
import { Lobby } from '@/features/session/Lobby';
import { useNavigation } from '@/lib/navigation';
import { ConnectionLostDialog } from './ConnectionLostDialog';
import { PlayerDepartureNotice } from './PlayerDepartureNotice';

type SessionProps = {
  sessionID: SessionId;
};

export default function Session({ sessionID }: SessionProps) {
  const navigation: Navigation = useNavigation();
  const sessionController: SessionController = useSessionController({
    sessionID,
    navigation,
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
      ) : sessionController.isLaunchingQuickPlay ? (
        <LoadingDialog message="Lancement de la partie" />
      ) : (
        <Lobby
          localPlayerID={sessionController.localPlayerID}
          isHost={sessionController.isHost}
          session={sessionController.session}
          handleUpdateGameConfig={sessionController.updateGameConfig}
          handleStartGame={sessionController.startGame}
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
