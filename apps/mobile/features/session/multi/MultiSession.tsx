import { type GameConfig, type Guess, SessionStatus } from '@cityborn/api';
import { useAuth, useError } from '@cityborn/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { useMultiSession } from '../hooks/useMultiSession';
import { MultiLobby } from './MultiLobby';

interface MultiSessionProps {
  sessionID: string;
}

export default function MultiSession({ sessionID }: MultiSessionProps) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const [localPlayerID, setLocalPlayerID] = useState<string | undefined>(
    user ? user.username : undefined,
  );
  const multiSession = useMultiSession(localPlayerID, sessionID);
  const hasJoinedSession = useRef(false);

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleJoinSession = useCallback(
    async (playerID: string) => {
      try {
        hasJoinedSession.current = true;
        await multiSession.join(playerID);
        setLocalPlayerID(playerID);
      } catch (error) {
        invokeError(error);
      }
    },
    [multiSession, invokeError],
  );

  ////////////////
  // useEffects //
  ////////////////

  useEffect(() => {
    if (
      multiSession.session &&
      localPlayerID &&
      !multiSession.connected &&
      multiSession.socket?.connected &&
      !hasJoinedSession.current
    ) {
      handleJoinSession(localPlayerID);
    }
  }, [
    multiSession.session,
    multiSession.socket,
    multiSession.socket?.connected,
    handleJoinSession,
    localPlayerID,
    multiSession.connected,
  ]);

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      await multiSession.updateGameConfig(gameConfig);
    } catch (error) {
      invokeError(error);
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await multiSession.startGame();
    } catch (error) {
      invokeError(error);
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      multiSession.guess(guess);
    } catch (error) {
      invokeError(error);
    }
  };

  const handleNextRound = async () => {
    try {
      multiSession.nextRound();
    } catch (error) {
      invokeError(error);
    }
  };

  const handleEndGame = async () => {
    try {
      await multiSession.endGame();
    } catch (error) {
      invokeError(error);
    }
  };

  const handlePlayAgain = async () => {
    try {
      await multiSession.playAgain();
    } catch {}
  };

  const handleExitGame = async () => {
    try {
      await multiSession.exitGame();
    } catch {}
  };

  ///////////////
  // Rendering //
  ///////////////

  if (!multiSession.session) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
        <Text className="text-center">Chargement de la session</Text>
      </View>
    );
  }

  if (multiSession.hasDisconnected && !multiSession.connected) {
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
        isHost={multiSession.isHost}
        game={multiSession.session.currentGame}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
        handleEndGame={handleEndGame}
        handlePlayAgain={handlePlayAgain}
        handleExitGame={handleExitGame}
      />
    );
  } else {
    return (
      <MultiLobby
        localPlayerID={localPlayerID}
        isHost={multiSession.isHost}
        session={multiSession.session}
        handleUpdateGameConfig={handleUpdateGameConfig}
        handleStartGame={handleStartGame}
        handleJoinSession={handleJoinSession}
      />
    );
  }
}
