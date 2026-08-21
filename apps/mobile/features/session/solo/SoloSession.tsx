import { type GameConfig, type Guess, isApiError } from '@cityborn/api';
import { useAuth, useError } from '@cityborn/client';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import { Game } from '../../game/Game';
import { useSoloSession } from '../hooks/useSoloSession';
import { SoloLobby } from './SoloLobby';

export default function SoloSession() {
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
    } catch (error) {
      invokeError(isApiError(error) ? error : String(error));
    }
  };

  ///////////////////////
  // Game interactions //
  ///////////////////////

  const handleStartGame = async () => {
    try {
      await soloSession.startGame();
    } catch (error) {
      invokeError(isApiError(error) ? error : String(error));
    }
  };

  const handleGuess = async (guess: Guess) => {
    try {
      soloSession.guess(guess);
    } catch (error) {
      invokeError(isApiError(error) ? error : String(error));
    }
  };

  const handleNextRound = async () => {
    try {
      soloSession.nextRound();
    } catch (error) {
      invokeError(isApiError(error) ? error : String(error));
    }
  };

  const handleEndGame = async () => {
    try {
      await soloSession.endGame();
    } catch (error) {
      invokeError(isApiError(error) ? error : String(error));
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
    } catch (error) {
      console.log(error);
    }
  };

  ///////////////
  // Rendering //
  ///////////////

  if (!soloSession.session)
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );

  if (soloSession.session.currentGame) {
    return (
      <Game
        localPlayerID={localPlayerID}
        isHost={soloSession.isHost}
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
      <SoloLobby
        isHost={soloSession.isHost}
        session={soloSession.session}
        handleUpdateGameConfig={handleUpdateGameConfig}
        handleStartGame={handleStartGame}
      />
    );
  }
}
