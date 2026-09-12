import { SessionStatus } from '@cityborn/api';
import { useAuth } from '@cityborn/client/auth/react';
import { useError } from '@cityborn/client/infrastructure/react';
import { useMultiSession } from '@cityborn/client/session/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { sessionGateway } from '@/lib/gateways';
import { useSessionNavigation } from '@/lib/navigation';
import { connectSessionSocket } from '@/lib/socket';
import { MultiLobby } from './MultiLobby';

interface MultiSessionProps {
  sessionID: string;
}

export default function MultiSession({ sessionID }: MultiSessionProps) {
  const { user } = useAuth();
  const { invokeError } = useError();
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

  if (!multiSession.session) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargement de la session</Text>
      </View>
    );
  }

  if (multiSession.hasDisconnected && !multiSession.isJoined) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Reconnexion...</Text>
      </View>
    );
  }

  if (
    multiSession.session.status === SessionStatus.IN_GAME &&
    multiSession.session.currentGame
  ) {
    return (
      <Game
        localPlayerID={localPlayerID}
        game={multiSession.session.currentGame}
        sessionController={multiSession}
      />
    );
  }

  return (
    <MultiLobby
      localPlayerID={localPlayerID}
      session={multiSession.session}
      sessionController={multiSession}
      handleJoinSession={handleJoinSession}
    />
  );
}
