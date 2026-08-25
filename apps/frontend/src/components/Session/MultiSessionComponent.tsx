'use client';

import {
  type CategoryTree,
  type GameConfig,
  type Guess,
  SessionStatus,
} from '@cityborn/api';
import { resolveCaughtError, useError } from '@cityborn/client';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiSession } from '@/hooks/useMultiSession';

export default function MultiSessionComponent({
  categoryTrees,
}: {
  categoryTrees: CategoryTree[];
}) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const { sessionID } = useParams<{ sessionID: string }>();

  const [localPlayerID, setLocalPlayerID] = useState<string | undefined>(
    user ? user.username : undefined,
  );

  const multiSession = useMultiSession(localPlayerID, sessionID);
  const hasJoinedSession = useRef(false);

  const handleJoinSession = useCallback(
    async (playerID: string) => {
      try {
        hasJoinedSession.current = true;
        await multiSession.join(playerID);
        setLocalPlayerID(playerID);
      } catch (error) {
        invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
      }
    },
    [multiSession.join, invokeError],
  );

  ////////////////
  // useEffects //
  ////////////////

  useEffect(() => {
    if (
      multiSession.session &&
      localPlayerID &&
      !multiSession.connected &&
      multiSession.socket.connected &&
      !hasJoinedSession.current
    ) {
      handleJoinSession(localPlayerID);
    }
  }, [
    multiSession.session,
    multiSession.socket.connected,
    handleJoinSession,
    localPlayerID,
    multiSession.connected,
  ]);

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleUpdateHost = async (newHostID: string) => {
    try {
      await multiSession.updateHost(newHostID);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      await multiSession.updateGameConfig(gameConfig);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleKickPlayer = async (playerToKick: string) => {
    try {
      await multiSession.kickPlayer(playerToKick);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await multiSession.startGame();
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      await multiSession.guess(guess);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleNextRound = async () => {
    try {
      await multiSession.nextRound();
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
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

  ///////////////
  // Rendering //
  ///////////////

  if (!multiSession.session)
    return <LoadingComponent message="Chargement de la session" />;

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

      {multiSession.hasDisconnected && !multiSession.connected && (
        <LoadingComponent message="Reconnexion..." />
      )}
    </>
  );
}
