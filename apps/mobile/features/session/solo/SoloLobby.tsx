import type { GameConfig, Session } from '@cityborn/api';
import {
  useCategorySelection,
  useCategoryTrees,
} from '@cityborn/client/session';
import { colors } from '@cityborn/design-system';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { fetchCategoryTrees } from '@/lib/api/category';

interface SoloLobbyProps {
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
}

export function SoloLobby({
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
}: SoloLobbyProps) {
  const categoryTrees = useCategoryTrees(fetchCategoryTrees);
  const {
    selectedPath,
    currentNodes,
    currentName,
    openCategory,
    goBack,
    playCategory,
  } = useCategorySelection({
    categoryTrees,
    session,
    isHost,
    updateGameConfig: handleUpdateGameConfig,
    startGame: handleStartGame,
  });

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-[88%] max-w-96">
        <Text className="text-2xl  font-bold">SOLO</Text>

        <View className="flex flex-col gap-2 w-full">
          <View className="flex-row items-center gap-1">
            {selectedPath.length > 0 && (
              <Pressable onPress={goBack}>
                <Icon
                  name="chevron_back_outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </Pressable>
            )}
            <Text className="text-xl">{currentName ?? 'Packs'}</Text>
          </View>
          <View className="w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <ScrollView className="max-h-96">
            <View className="flex flex-col gap-2 w-full">
              {currentNodes.map((node) => (
                <View
                  key={node.id}
                  className="flex-row items-center justify-between gap-3 py-2 border-b border-foreground/10"
                >
                  <Text className="flex-1 text-lg font-semibold">
                    {node.name}
                  </Text>
                  <View className="flex-col gap-1">
                    <Button
                      size="small"
                      label="Jouer"
                      disabled={!isHost}
                      onPress={() => playCategory(node)}
                      className="w-26 h-9"
                    />
                    {node.children.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        label="Sous-packs"
                        onPress={() => openCategory(node)}
                        className="w-26 h-9 px-0"
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
