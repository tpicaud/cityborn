import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { View, Text } from '@/components/ui/native/NativeComponents';
import { apiClient } from '@/lib/apiClient';
import { useError } from '@cityborn/contexts';
import { Category, GameConfig, Session } from '@cityborn/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, TouchableOpacity } from 'react-native';

interface SoloLobbyProps {
  localPlayerID: string | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
}

export function SoloLobbyComponent({
  localPlayerID,
  session,
  isHost,
  handleUpdateGameConfig,
  handleStartGame,
}: SoloLobbyProps) {
  const router = useRouter();
  const { invokeError } = useError();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await apiClient.fetchCategories();
        setCategories(categories);
      } catch {
        invokeError('Aucunes catégories trouvées');
      }
    };
    fetchCategories();
  }, []);

  return (
    <View className="flex-1 justi items-center">
      <View className="flex-1 flex items-center justify-center gap-10 w-70">
        <Text className="text-2xl  font-bold">SOLO</Text>

        <View className="flex flex-col gap-2 w-full">
          <Text className="text-xl">Catégories</Text>
          <View className="flex flex-wrap flex-row gap-2">
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
                    <Text>{cat.name.toUpperCase()}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button size="large" label="JOUER" />
      </View>
    </View>
  );
}
