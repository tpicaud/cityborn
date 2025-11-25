import { useAuth, useError } from '@cityborn/contexts';
import { GameConfig, Guess } from '@cityborn/types';
import { SoloLobbyComponent } from './SoloLobbyComponent';
import { View } from '@/components/ui/native/NativeComponents';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { GameComponent } from './GameComponent';
import { useSoloSession } from './hooks/useSoloSession';

export default function SoloSessionComponent() {
  const { user } = useAuth();
  const { invokeError } = useError();
  const localPlayerID = user ? user.username : 'guest';
  const soloSession = useSoloSession(localPlayerID);

  //////////////////////////
  // Session interactions //
  //////////////////////////

  const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    try {
      soloSession.updateGameConfig(gameConfig);
    } catch (error: any) {
      invokeError(error);
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await soloSession.startGame();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      soloSession.guess(guess);
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleNextRound = async () => {
    try {
      soloSession.nextRound();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handleEndGame = async () => {
    try {
      await soloSession.endGame();
    } catch (error: any) {
      invokeError(error);
    }
  };

  const handlePlayAgain = async () => {
    try {
      await soloSession.playAgain();
    } catch (error) {
      console.log(error);
    }
  };

  const handleExitGame = async () => {
    try {
      await soloSession.exitGame();
    } catch (error: any) {
      console.log(error);
    }
  };

  ///////////////
  // Rendering //
  ///////////////

  // si pas de session, chargement
  if (!soloSession.session)
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );

  // Si game, display game
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
    // display lobby
    return (
      <SoloLobbyComponent
        localPlayerID={localPlayerID}
        isHost={soloSession.isHost}
        session={soloSession.session}
        handleUpdateGameConfig={handleUpdateGameConfig}
        handleStartGame={handleStartGame}
      />
    );
  }
}
