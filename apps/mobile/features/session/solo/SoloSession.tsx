import {
  type SessionController,
  useSoloSession,
} from '@cityborn/client/session';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import { Game } from '@/features/game/Game';
import { sessionApi } from '@/lib/api/session';
import { useNavigation } from '@/lib/navigation';
import { SoloLobby } from './SoloLobby';

export default function SoloSession() {
  const navigation = useNavigation();
  const soloSession: SessionController = useSoloSession({
    sessionApi,
    navigation,
  });

  if (!soloSession.session)
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );

  if (soloSession.session.currentGame) {
    return (
      <Game
        localPlayerID={soloSession.localPlayerID}
        isHost={soloSession.isHost}
        game={soloSession.session.currentGame}
        handleGuess={soloSession.guess}
        handleNextRound={soloSession.nextRound}
        handleEndGame={soloSession.endGame}
        handlePlayAgain={soloSession.playAgain}
        handleExitGame={soloSession.exitGame}
      />
    );
  }

  return (
    <SoloLobby
      isHost={soloSession.isHost}
      session={soloSession.session}
      handleUpdateGameConfig={soloSession.updateGameConfig}
      handleStartGame={soloSession.startGame}
    />
  );
}
