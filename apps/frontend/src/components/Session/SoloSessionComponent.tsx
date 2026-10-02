'use client';

import {
  type SessionController,
  useSoloSession,
} from '@cityborn/client/session';
import { Game } from '@/components/Session/Game';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/ui/loaders/LoadingComponent';
import { sessionApi } from '@/lib/api/session';
import { useNavigation } from '@/lib/navigation';

export default function SoloSessionComponent() {
  const navigation = useNavigation();
  const soloSession: SessionController = useSoloSession({
    sessionApi,
    navigation,
  });

  if (!soloSession.session)
    return <LoadingComponent message="Chargement de la session" />;

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
    <LobbyComponent
      localPlayerID={soloSession.localPlayerID}
      isHost={soloSession.isHost}
      session={soloSession.session}
      handleUpdateGameConfig={soloSession.updateGameConfig}
      handleStartGame={soloSession.startGame}
    />
  );
}
