'use client';

import {
  type SessionController,
  useSoloSession,
} from '@cityborn/client/session';
import { Game } from '@/components/Session/Game';
import { Lobby } from '@/components/Session/Lobby';
import LoadingDialog from '@/components/ui/loaders/LoadingDialog';
import { sessionApi } from '@/lib/api/session';
import { useNavigation } from '@/lib/navigation';

export default function SoloSession() {
  const navigation = useNavigation();
  const soloSession: SessionController = useSoloSession({
    sessionApi,
    navigation,
  });

  if (!soloSession.session)
    return <LoadingDialog message="Chargement de la session" />;

  if (soloSession.session.currentGame) {
    return (
      <Game
        localPlayerID={soloSession.localPlayerID}
        isHost={soloSession.isHost}
        session={soloSession.session}
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
    <Lobby
      localPlayerID={soloSession.localPlayerID}
      isHost={soloSession.isHost}
      session={soloSession.session}
      handleUpdateGameConfig={soloSession.updateGameConfig}
      handleStartGame={soloSession.startGame}
    />
  );
}
