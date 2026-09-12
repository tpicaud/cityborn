import { useAuth } from '@cityborn/client/auth/react';
import { useSoloSession } from '@cityborn/client/session/react';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { View } from '@/components/ui/native/NativeComponents';
import { sessionGateway } from '@/lib/gateways';
import { useSessionNavigation } from '@/lib/navigation';
import { Game } from '../../game/Game';
import { SoloLobby } from './SoloLobby';

export default function SoloSession() {
  const { user } = useAuth();
  const navigation = useSessionNavigation();
  const localPlayerID = user ? user.username : 'guest';
  const soloSession = useSoloSession(localPlayerID, {
    sessionGateway,
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
        localPlayerID={localPlayerID}
        game={soloSession.session.currentGame}
        sessionController={soloSession}
      />
    );
  }

  return (
    <SoloLobby session={soloSession.session} sessionController={soloSession} />
  );
}
