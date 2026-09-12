'use client';

import type { CategoryTree } from '@cityborn/api';
import { useAuth } from '@cityborn/client/auth/react';
import { useSoloSession } from '@cityborn/client/session/react';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import { sessionGateway } from '@/lib/gateways';
import { useSessionNavigation } from '@/lib/navigation';

export default function SoloSessionComponent({
  categoryTrees,
}: {
  categoryTrees: CategoryTree[];
}) {
  const { user } = useAuth();
  const navigation = useSessionNavigation();
  const localPlayerID = user ? user.username : 'guest';
  const soloSession = useSoloSession(localPlayerID, {
    sessionGateway,
    navigation,
  });

  if (!soloSession.session)
    return <LoadingComponent message="Chargement de la session" />;

  if (soloSession.session.currentGame) {
    return (
      <GameComponent
        localPlayerID={localPlayerID}
        session={soloSession.session}
        game={soloSession.session.currentGame}
        sessionController={soloSession}
      />
    );
  }

  return (
    <LobbyComponent
      localPlayerID={localPlayerID}
      session={soloSession.session}
      categoryTrees={categoryTrees}
      sessionController={soloSession}
    />
  );
}
