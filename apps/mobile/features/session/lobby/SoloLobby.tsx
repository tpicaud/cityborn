import type { GameConfigChanges, Session } from '@cityborn/api';
import { type PackSelection, usePackSelection } from '@cityborn/client/session';
import { ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import LoaderIcon from '@/components/ui/LoaderIcon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { PackThemeFilters } from './PackThemeFilters';

type SoloLobbyProps = {
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  handleStartGame: () => Promise<void>;
};

export function SoloLobby({
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
}: SoloLobbyProps) {
  const {
    isLoading: isLoadingPacks,
    themes,
    selectedTheme,
    selectTheme,
    packs,
    playPack,
  }: PackSelection = usePackSelection({
    session,
    isHost,
    updateGameConfig: handleUpdateGameConfig,
    startGame: handleStartGame,
  });

  if (isLoadingPacks) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoaderIcon />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-[88%] max-w-96">
        <Text className="text-2xl  font-bold">SOLO</Text>

        <View className="flex flex-col gap-2 w-full">
          <PackThemeFilters
            themes={themes}
            selectedTheme={selectedTheme}
            selectTheme={selectTheme}
          />
          <Text className="text-xl">{selectedTheme?.name ?? 'Packs'}</Text>
          <View className="w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <ScrollView className="max-h-96">
            <View className="flex flex-col gap-2 w-full">
              {packs.map((pack) => (
                <View
                  key={pack.id}
                  className="flex-row items-center justify-between gap-3 py-2 border-b border-foreground/10"
                >
                  <Text className="flex-1 text-lg font-semibold">
                    {pack.name}
                  </Text>
                  <Button
                    size="small"
                    label="Jouer"
                    disabled={!isHost}
                    onPress={() => playPack(pack)}
                    className="w-26 h-9"
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
