import ScreenLayout from '@/components/ScreenLayout';
import { SoloLobbyComponent } from '@/features/session/SoloLobbyComponent';
import { GameConfig } from '@cityborn/types';

export default function SoloSessionScreen() {
  <ScreenLayout>
    <SoloLobbyComponent
      localPlayerID={undefined}
      session={undefined}
      isHost={false}
      handleUpdateGameConfig={function (
        gameConfig: Partial<GameConfig>,
      ): Promise<void> {
        throw new Error('Function not implemented.');
      }}
      handleStartGame={function (): Promise<void> {
        throw new Error('Function not implemented.');
      }}
    />
  </ScreenLayout>;
}
