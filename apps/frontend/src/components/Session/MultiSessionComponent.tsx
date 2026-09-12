'use client';

import { type CategoryTree, SessionStatus } from '@cityborn/api';
import { useAuth } from '@cityborn/client/auth/react';
import { useError } from '@cityborn/client/infrastructure/react';
import { useMultiSession } from '@cityborn/client/session/react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { sessionGateway } from '@/lib/gateways';
import { useSessionNavigation } from '@/lib/navigation';
import { connectSessionSocket } from '@/lib/socket';

export default function MultiSessionComponent({
  categoryTrees,
}: {
  categoryTrees: CategoryTree[];
}) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const { sessionID } = useParams<{ sessionID: string }>();
  const navigation = useSessionNavigation();

  const [localPlayerID, setLocalPlayerID] = useState<string | undefined>(
    user ? user.username : undefined,
  );

  const multiSession = useMultiSession(localPlayerID, sessionID, {
    sessionGateway,
    connectSocket: connectSessionSocket,
    navigation,
  });
  const hasJoinedSession = useRef(false);

  const handleJoinSession = useCallback(
    async (playerID: string) => {
      try {
        hasJoinedSession.current = true;
        await multiSession.join(playerID);
        setLocalPlayerID(playerID);
      } catch (error) {
        invokeError(error, 'Une erreur est survenue');
      }
    },
    [multiSession.join, invokeError],
  );

  useEffect(() => {
    if (
      multiSession.session &&
      localPlayerID &&
      !multiSession.isJoined &&
      multiSession.isSocketConnected &&
      !hasJoinedSession.current
    ) {
      handleJoinSession(localPlayerID);
    }
  }, [
    multiSession.session,
    multiSession.isSocketConnected,
    multiSession.isJoined,
    handleJoinSession,
    localPlayerID,
  ]);

  if (!multiSession.session)
    return <LoadingComponent message="Chargement de la session" />;

  return (
    <>
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
        <GameComponent
          localPlayerID={localPlayerID}
          session={multiSession.session}
          game={multiSession.session.currentGame}
          sessionController={multiSession}
        />
      ) : (
        <LobbyComponent
          localPlayerID={localPlayerID}
          session={multiSession.session}
          categoryTrees={categoryTrees}
          sessionController={multiSession}
          handleJoinSession={handleJoinSession}
        />
      )}

      {multiSession.hasDisconnected && !multiSession.isJoined && (
        <LoadingComponent message="Reconnexion..." />
      )}
    </>
  );
}
