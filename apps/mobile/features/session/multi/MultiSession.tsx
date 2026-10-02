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
import { useMultiSession } from '@cityborn/client/session';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { sessionApi } from '@/lib/api/session';
import { useNavigation } from '@/lib/navigation';
import { createSocketConnection } from '@/lib/socket';
import { MultiLobby } from './MultiLobby';

interface MultiSessionProps {
  sessionID: SessionId;
}

export default function MultiSession({ sessionID }: MultiSessionProps) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const navigation = useNavigation();
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

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleJoinSession = async (playerID: string) => {
    try {
      const parsedPlayerId = PlayerIdSchema.parse(playerID);
      await multiSession.join(parsedPlayerId);
      setLocalPlayerID(parsedPlayerId);
    } catch (error) {
      invokeError(error);
    }
  };

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
      await multiSession.guess(guess);
    } catch (error) {
      invokeError(error);
    }
  };

  const handleNextRound = async () => {
    try {
      await multiSession.nextRound();
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

  return (
    <View className="flex-1">
      {multiSession.session.status === SessionStatus.IN_GAME &&
      multiSession.session.currentGame ? (
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
      ) : (
        <MultiLobby
          localPlayerID={localPlayerID}
          isHost={multiSession.isHost}
          session={multiSession.session}
          handleUpdateGameConfig={handleUpdateGameConfig}
          handleStartGame={handleStartGame}
          handleJoinSession={handleJoinSession}
        />
      )}

      {multiSession.connectionStatus === 'reconnecting' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
            <LoaderIcon />
            <Text className="text-center">Reconnexion...</Text>
          </View>
        </View>
      )}

      {multiSession.connectionStatus === 'closed' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="items-center gap-4 py-8 px-6 bg-background rounded-xl">
            <Text className="text-center">Connexion à la session perdue</Text>
            <View className="flex-row gap-3">
              <Button
                label="Quitter"
                variant="outlined"
                onPress={handleExitGame}
              />
              <Button
                label="Réessayer"
                onPress={multiSession.retryConnection}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
