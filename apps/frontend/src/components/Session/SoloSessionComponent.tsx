'use client';

import {
  type CategoryTree,
  type GameConfig,
  type Guess,
  PlayerIdSchema,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import { useSoloSession } from '@cityborn/client/session';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import { useNavigation } from '@/lib/navigation';
import { sessionApi } from '@/lib/sessionApi';

export default function SoloSessionComponent({
  categoryTrees,
}: {
  categoryTrees: CategoryTree[];
}) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const navigation = useNavigation();
  const localPlayerID = user?.username ?? PlayerIdSchema.parse('guest');
  const soloSession = useSoloSession({
    localPlayerID,
    sessionApi,
    navigation,
  });

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleJoinSession = async () => {};

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      await soloSession.updateGameConfig(gameConfig);
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await soloSession.startGame();
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      await soloSession.guess(guess);
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleNextRound = async () => {
    try {
      await soloSession.nextRound();
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handleEndGame = async () => {
    try {
      await soloSession.endGame();
    } catch (error) {
      invokeError(error, 'Une erreur est survenue');
    }
  };

  const handlePlayAgain = async () => {
    try {
      await soloSession.playAgain();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExitGame = async () => {
    try {
      await soloSession.exitGame();
    } catch (error) {
      console.error(error);
    }
  };

  ///////////////
  // Rendering //
  ///////////////

  if (!soloSession.session)
    return <LoadingComponent message="Chargement de la session" />;

  if (soloSession.session.currentGame) {
    return (
      <GameComponent
        localPlayerID={localPlayerID}
        isHost={soloSession.isHost}
        session={soloSession.session}
        game={soloSession.session.currentGame}
        handleGuess={handleGuess}
        handleNextRound={handleNextRound}
        handleEndGame={handleEndGame}
        handlePlayAgain={handlePlayAgain}
        handleExitGame={handleExitGame}
      />
    );
  }

  return (
    <LobbyComponent
      localPlayerID={localPlayerID}
      isHost={soloSession.isHost}
      session={soloSession.session}
      categoryTrees={categoryTrees}
      handleUpdateGameConfig={handleUpdateGameConfig}
      handleStartGame={handleStartGame}
      handleJoinSession={handleJoinSession}
    />
  );
}
