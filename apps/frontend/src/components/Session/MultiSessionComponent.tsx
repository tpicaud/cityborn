'use client';

import { type SessionId, SessionStatus } from '@cityborn/api';
import type { Navigation } from '@cityborn/client/platform';
import {
  type MultiSessionController,
  sessionIdFromMultiSessionPath,
  useMultiSession,
} from '@cityborn/client/session';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ConnectionLostDialog } from '@/components/Session/ConnectionLostDialog';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { sessionApi } from '@/lib/api/session';
import { useNavigation } from '@/lib/navigation';
import { createSocketConnection } from '@/lib/socket';

const sessionLoadingMessage = 'Chargement de la session';

type MultiSessionProps = {
  sessionID: SessionId;
  navigation: Navigation;
};

export default function MultiSessionComponent() {
  const navigation: Navigation = useNavigation();
  const sessionID: SessionId | null = sessionIdFromMultiSessionPath(
    usePathname(),
  );

  useEffect(() => {
    if (!sessionID) navigation.returnTo('/');
  }, [sessionID, navigation]);

  if (!sessionID) return <LoadingComponent message={sessionLoadingMessage} />;

  return <MultiSession sessionID={sessionID} navigation={navigation} />;
}

function MultiSession({ sessionID, navigation }: MultiSessionProps) {
  const multiSession: MultiSessionController = useMultiSession({
    sessionID,
    sessionApi,
    navigation,
    createSocket: createSocketConnection,
  });

  if (!multiSession.session)
    return <LoadingComponent message={sessionLoadingMessage} />;

  return (
    <>
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
        <GameComponent
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
        <LobbyComponent
          localPlayerID={multiSession.localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          handleUpdateGameConfig={multiSession.updateGameConfig}
          handleStartGame={multiSession.startGame}
          handleJoinSession={multiSession.join}
        />
      )}

      {multiSession.connectionStatus === 'reconnecting' && (
        <LoadingComponent message="Reconnexion..." />
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
