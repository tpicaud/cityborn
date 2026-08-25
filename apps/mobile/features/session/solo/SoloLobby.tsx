import type { CategoryTree, GameConfig, Session } from '@cityborn/api';
import { toAppError, useError } from '@cityborn/client';
import { colors } from '@cityborn/design-system';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import Button from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text, View } from '@/components/ui/native/NativeComponents';
import {
  categoryTreeToCategory,
  fetchCategoryTrees,
  flattenCategoryTree,
} from '@/lib/api/category';

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
  const { invokeError } = useError();
  const [categoryTrees, setCategoryTrees] = useState<CategoryTree[]>([]);
  const [selectedPath, setSelectedPath] = useState<CategoryTree[]>([]);

  useEffect(() => {
    const loadCategoryTrees = async () => {
      const result = await fetchCategoryTrees();
      if (!result.ok) return invokeError(toAppError(result.error));
      setCategoryTrees(result.data);
    };
    loadCategoryTrees();
  }, [invokeError]);

  useEffect(() => {
    if (
      categoryTrees.length > 0 &&
      session.gameConfig.categories.length === 0
    ) {
      handleUpdateGameConfig({
        categories: flattenCategoryTree(categoryTrees),
      });
    }
  }, [
    categoryTrees,
    session.gameConfig.categories.length,
    handleUpdateGameConfig,
  ]);

  const currentCategoryNodes =
    selectedPath.length === 0
      ? categoryTrees
      : selectedPath[selectedPath.length - 1].children;

  const handlePlayCategory = async (node: CategoryTree) => {
    await handleUpdateGameConfig({
      categories: [categoryTreeToCategory(node)],
    });
    await handleStartGame();
  };

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-[88%] max-w-96">
        <Text className="text-2xl  font-bold">SOLO</Text>

        <View className="flex flex-col gap-2 w-full">
          <View className="flex-row items-center gap-1">
            {selectedPath.length > 0 && (
              <Pressable
                onPress={() => setSelectedPath((path) => path.slice(0, -1))}
              >
                <Icon
                  name="chevron_back_outline"
                  size={20}
                  color={colors.primary[500]}
                />
              </Pressable>
            )}
            <Text className="text-xl">
              {selectedPath.length === 0
                ? 'Packs'
                : selectedPath[selectedPath.length - 1].name}
            </Text>
          </View>
          <View className="w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <ScrollView className="max-h-96">
            <View className="flex flex-col gap-2 w-full">
              {currentCategoryNodes.map((node) => (
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
                      onPress={() => handlePlayCategory(node)}
                      className="w-26 h-9"
                    />
                    {node.children.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        label="Sous-packs"
                        onPress={() =>
                          setSelectedPath((path) => [...path, node])
                        }
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
