'use client';

import { type SessionId, SessionStatus } from '@cityborn/api';
import {
  type MultiSessionController,
  useMultiSessionController,
} from '@cityborn/client/session';
import { ConnectionLostDialog } from '@/components/Session/ConnectionLostDialog';
import { Game } from '@/components/Session/Game';
import { Lobby } from '@/components/Session/Lobby';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import { useNavigation } from '@/lib/navigation';

type MultiSessionProps = {
  sessionID: SessionId;
};

export default function MultiSession({ sessionID }: MultiSessionProps) {
  const navigation = useNavigation();
  const multiSession: MultiSessionController = useMultiSessionController({
    sessionID,
    navigation,
  });

  if (!multiSession.session)
    return <LoadingDialog message="Chargement de la session" />;

  return (
    <>
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
        <Game
          localPlayerID={multiSession.localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          game={multiSession.session.currentGame}
          handleGuess={multiSession.guess}
          handleNextRound={multiSession.nextRound}
          handleEndGame={multiSession.endGame}
          handlePlayAgain={multiSession.playAgain}
          handleExitGame={multiSession.exitGame}
        />
      ) : (
        <Lobby
          localPlayerID={multiSession.localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          handleUpdateGameConfig={multiSession.updateGameConfig}
          handleStartGame={multiSession.startGame}
          handleJoinSession={multiSession.join}
        />
      )}

      {multiSession.connectionStatus === 'reconnecting' && (
        <LoadingDialog message="Reconnexion..." />
      )}

      {multiSession.connectionStatus === 'closed' && (
        <ConnectionLostDialog
          onRetry={multiSession.retryConnection}
          onExit={multiSession.exitGame}
        />
      )}
    </>
  );
}
