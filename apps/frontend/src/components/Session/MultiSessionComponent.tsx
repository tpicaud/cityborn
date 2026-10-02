'use client';

import {
  type GameConfig,
  type Guess,
  type PlayerId,
  PlayerIdSchema,
  type SessionId,
  SessionStatus,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import { useCategoryTrees } from '@cityborn/client/category';
import type { Navigation } from '@cityborn/client/platform';
import {
  sessionIdFromMultiSessionPath,
  useMultiSession,
} from '@cityborn/client/session';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConnectionLostDialog } from '@/components/Session/ConnectionLostDialog';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { categoryApi } from '@/lib/api/category';
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
  const { user } = useAuth();
  const { invokeError } = useError();
  const { categoryTrees, isLoading: isLoadingCategoryTrees } =
    useCategoryTrees(categoryApi);

  const [localPlayerID, setLocalPlayerID] = useState<PlayerId | undefined>(
    user?.username,
  );

  const multiSession = useMultiSession({
    localPlayerID,
    sessionID,
    sessionApi,
    navigation,
    createSocket: createSocketConnection,
  });

  const handleJoinSession = async (playerID: string) => {
    try {
      const parsedPlayerId = PlayerIdSchema.parse(playerID);
      await multiSession.join(parsedPlayerId);
      setLocalPlayerID(parsedPlayerId);
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleUpdateHost = async (newHostID: string) => {
    try {
      await multiSession.updateHost(PlayerIdSchema.parse(newHostID));
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      await multiSession.updateGameConfig(gameConfig);
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleKickPlayer = async (playerToKick: string) => {
    try {
      await multiSession.kickPlayer(PlayerIdSchema.parse(playerToKick));
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleStartGame = async () => {
    try {
      await multiSession.startGame();
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      await multiSession.guess(guess);
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleNextRound = async () => {
    try {
      await multiSession.nextRound();
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleEndGame = async () => {
    try {
      await multiSession.endGame();
    } catch (error) {
      console.error(error);
    }
  };

  const handlePlayAgain = async () => {
    try {
      await multiSession.playAgain();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExitGame = async () => {
    try {
      await multiSession.exitGame();
    } catch (error) {
      console.error(error);
    }
  };

  if (!multiSession.session)
    return <LoadingComponent message={sessionLoadingMessage} />;

  if (
    multiSession.session.status !== SessionStatus.IN_GAME &&
    isLoadingCategoryTrees
  ) {
    return <LoadingComponent message="Chargement des catégories" />;
  }

  return (
    <>
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
        <GameComponent
          localPlayerID={localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          game={multiSession.session.currentGame}
          handleGuess={handleGuess}
          handleNextRound={handleNextRound}
          handleEndGame={handleEndGame}
          handlePlayAgain={handlePlayAgain}
          handleExitGame={handleExitGame}
        />
      ) : (
        <LobbyComponent
          localPlayerID={localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          categoryTrees={categoryTrees}
          handleUpdateHost={handleUpdateHost}
          handleUpdateGameConfig={handleUpdateGameConfig}
          handleKickPlayer={handleKickPlayer}
          handleStartGame={handleStartGame}
          handleJoinSession={handleJoinSession}
        />
      )}

      {multiSession.connectionStatus === 'reconnecting' && (
        <LoadingComponent message="Reconnexion..." />
      )}

      {multiSession.connectionStatus === 'closed' && (
        <ConnectionLostDialog
          onRetry={multiSession.retryConnection}
          onExit={handleExitGame}
        />
      )}
    </>
  );
}
