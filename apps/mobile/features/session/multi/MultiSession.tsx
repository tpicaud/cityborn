import { useAuth, useError } from '@cityborn/contexts';
import { GameConfig, Guess, SessionStatus } from '@cityborn/types';
import { View, Text } from '@/components/ui/native/NativeComponents';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Game } from '@/features/game/Game';
import { MultiLobby } from './MultiLobby';
import { useMultiSession } from '../hooks/useMultiSession';
import { useEffect, useRef, useState } from 'react';

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

  ////////////////
  // useEffects //
  ////////////////

  // Auto connect to session
  useEffect(() => {
    if (
      multiSession.session &&
      localPlayerID &&
      !multiSession.connected &&
      multiSession.socket &&
      multiSession.socket.connected &&
      !hasJoinedSession.current
    ) {
      handleJoinSession(localPlayerID);
    }
  }, [
    multiSession.session,
    multiSession.socket,
    multiSession.socket?.connected,
  ]);

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleJoinSession = async (playerID: string) => {
    try {
      hasJoinedSession.current = true;
      await multiSession.join(playerID);
      setLocalPlayerID(playerID);
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      await multiSession.updateGameConfig(gameConfig);
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleUpdateHost = async (newHostId: string) => {
    try {
      await multiSession.updateHost(newHostId);
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    try {
      await multiSession.kickPlayer(playerId);
    } catch (error: any) {
      invokeError(error);
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await multiSession.startGame();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      multiSession.guess(guess);
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleNextRound = async () => {
    try {
      multiSession.nextRound();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleEndGame = async () => {
    try {
      await multiSession.endGame();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handlePlayAgain = async () => {
    try {
      await multiSession.playAgain();
    } catch (error) {
      console.log(error);
    }
  };

  const handleExitGame = async () => {
    try {
      await multiSession.exitGame();
    } catch (error: any) {
      console.log(error);
    }
  };

  ///////////////
  // Rendering //
  ///////////////

  // si pas de session, chargement
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

  // Si game, display game
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
        handleUpdateHost={handleUpdateHost}
        handleUpdateGameConfig={handleUpdateGameConfig}
        handleKickPlayer={handleKickPlayer}
        handleStartGame={handleStartGame}
        handleJoinSession={handleJoinSession}
      />
    );
  }
}
