'use client';

import type { CategoryTree, GameConfig, Guess } from '@cityborn/api';
import { resolveCaughtError, useError } from '@cityborn/client';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useSoloSession } from '@/hooks/useSoloSession';

export default function SoloSessionComponent({
  categoryTrees,
}: {
  categoryTrees: CategoryTree[];
}) {
  const { user } = useAuth();
  const { invokeError } = useError();
  const localPlayerID = user ? user.username : 'guest';
  const soloSession = useSoloSession(localPlayerID);

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleJoinSession = async () => {};

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      soloSession.updateGameConfig(gameConfig);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await soloSession.startGame();
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      soloSession.guess(guess);
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleNextRound = async () => {
    try {
      soloSession.nextRound();
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
    }
  };

  const handleEndGame = async () => {
    try {
      await soloSession.endGame();
    } catch (error) {
      invokeError(resolveCaughtError(error, 'Une erreur est survenue'));
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
  } else {
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
}
