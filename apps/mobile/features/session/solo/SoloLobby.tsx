import type { Category, GameConfig, Session } from '@cityborn/api';
import { useError } from '@cityborn/contexts';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Text, View } from '@/components/ui/native/NativeComponents';
import { fetchCategories } from '@/lib/api/category';

interface SoloLobbyProps {
  localPlayerID: string | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
}

export function SoloLobby({
  localPlayerID,
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
}: SoloLobbyProps) {
  const { invokeError } = useError();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const result = await fetchCategories();
      if (!result.ok) return invokeError(result.error);
      setCategories(result.data);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    handleUpdateGameConfig({
      categories: categories.filter((cat) =>
        selectedCategories.includes(cat.id),
      ),
    });
  }, [selectedCategories]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <View className="flex-1 justify-center items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-70">
        <Text className="text-2xl  font-bold">SOLO</Text>

        <View className="flex flex-col gap-2 w-full">
          <Text className="text-xl">Catégories</Text>
          <View className=" w-full h-[1px] bg-foreground mt-[-6] mb-1"></View>
          <View className="flex flex-wrap flex-row gap-2">
            {/* All categories chip */}
            <Pressable onPress={() => setSelectedCategories([])} key={'all'}>
              <Card
                variant="outline"
                className={`rounded-2xl border-2 border-primary w-34 flex items-center justify-center
                      ${
                        selectedCategories.length === 0
                          ? 'opacity-100'
                          : 'opacity-40'
                      }`}
              >
                <Text className="text-center font-bold">Toutes</Text>
              </Card>
            </Pressable>

            {/* Categories chips */}
            {categories.map((cat) => {
              return (
                <Pressable onPress={() => toggleCategory(cat.id)} key={cat.id}>
                  <Card
                    variant="outline"
                    className={`rounded-2xl border-2 border-primary w-34 flex items-center justify-center
                      ${
                        selectedCategories.includes(cat.id)
                          ? 'opacity-100'
                          : 'opacity-40'
                      }`}
                  >
                    <Text className="text-center font-bold">{cat.name}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          size="large"
          label="JOUER"
          onPress={async () => {
            await handleUpdateGameConfig({
              ...session.gameConfig,
              categories: categories.filter((cat) =>
                selectedCategories.includes(cat.id),
              ),
            });
            await handleStartGame();
          }}
        />
      </View>
    </View>
  );
}
